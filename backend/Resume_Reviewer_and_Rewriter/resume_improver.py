"""
Resume Improver - Intégration NLP + Groq LLM + LaTeX Generation
Système complet: Analyse NLP → Amélioration LLM → CV LaTeX optimisé
"""

from groq import Groq
from resume_analyzer import ResumeAnalyzerAPI
import json
from typing import Dict, List
import time
import subprocess
import os
import tempfile


class ResumeImprover:
    """
    Classe qui combine l'analyse NLP avec l'amélioration par LLM et génération LaTeX
    """
    
    # Template LaTeX de base
    LATEX_TEMPLATE = r"""\documentclass[9pt]{article}
\usepackage[margin=0.4in]{geometry}
\usepackage{enumitem}
\usepackage{xcolor}
\usepackage{hyperref}
\usepackage{titlesec}
\usepackage{multicol}
\usepackage{parskip}
\usepackage{fontawesome5}

\definecolor{accentTitle}{HTML}{00008b}
\definecolor{accentLine}{HTML}{196470}

\hypersetup{
    colorlinks=true,
    urlcolor=accentLine,
    linkcolor=accentTitle
}

\newcommand{\headingBf}[1]{\textbf{\large #1}}
\newcommand{\cvitem}[2]{#2}

\titleformat{\section}
  {\color{accentTitle}\bfseries\normalsize}{}{0em}{}[\color{accentLine}\titlerule]

\titleformat{\subsection}[runin]
  {\color{accentTitle}\bfseries\small}{}{0em}{}[ -- ]

\titlespacing*{\section}{0pt}{4pt}{2pt}
\titlespacing*{\subsection}{0pt}{2pt}{2pt}
\setlist[itemize]{left=1em, topsep=1pt, itemsep=1pt}

\pagestyle{empty}

\begin{document}

%CONTENT_PLACEHOLDER%

\end{document}
"""
    
    def __init__(self, groq_api_key: str):
        """
        Initialise l'improver avec la clé API Groq
        
        Args:
            groq_api_key: Clé API Groq (gratuite sur groq.com)
        """
        self.analyzer_api = ResumeAnalyzerAPI()
        self.groq_client = Groq(api_key=groq_api_key)
        self.model = "llama-3.3-70b-versatile"
    
    def analyze_and_improve(self, pdf_path: str, language: str = "en") -> Dict:
        """
        Pipeline complet: Analyse → Amélioration → Rapport → LaTeX
        
        Args:
            pdf_path: Chemin vers le PDF du CV
            language: 'en' ou 'fr' pour les suggestions
            
        Returns:
            Dictionnaire avec analyse originale et texte amélioré
        """
        print("🔍 Phase 1: NLP Analysis of CV...")
        analysis_result = self.analyzer_api.analyze(pdf_path)
        
        print(f"✅ Analysis completed - Score: {analysis_result['score']}/100")
        print(f"📊 Niveau: {analysis_result['level']}")
        print(f"⚠️  {len(analysis_result['issues_to_fix']['high_priority'])} critical issues detected")
        
        print("\n🤖 Phase 2: AI-Powered Improvements...")
        improvements = self._improve_sections(
            analysis_result['full_analysis'], 
            language
        )
        
        print("\n📄 Phase 3: Generating Improved LaTeX CV...")
        latex_content = self._generate_latex_resume(
            analysis_result,
            improvements,
            language
        )
        
        print("\n✨ Phase 4: Generating Final Report...")
        final_report = self._generate_final_report(
            analysis_result, 
            improvements
        )
        
        return {
            'original_analysis': analysis_result,
            'improvements': improvements,
            'latex_content': latex_content,
            'final_report': final_report
        }
    
    def _improve_sections(self, full_analysis: Dict, language: str) -> Dict:
       
        """Improves each problematic section with LLM"""
        improvements = {}
        analysis = full_analysis['analysis']
        
        # 1. Améliorer la section Expérience
        experience_text = self.analyzer_api.analyzer.section_detector.extract_section_content(
            analysis['clean_text'], 
            'experience'
        )
        
        if experience_text:
            print("  📝 Improving Experience section...")
            improvements['experience'] = self._improve_experience_section(
                experience_text,
                analysis['verb_analysis'],
                analysis['metrics'],
                language
            )
        
        # 2. Generate professional summary if missing
        if not analysis['sections'].get('summary'):
            print("  ✍️  Generating professional summary...")
            improvements['professional_summary'] = self._generate_professional_summary(
                analysis,
                language
            )
        
        # 3. Improve skills presentation
        skills_text = self.analyzer_api.analyzer.section_detector.extract_section_content(
            analysis['clean_text'], 
            'skills'
        )
        
        if skills_text:
            print("  🎯 Optimizing Skills section...")
            improvements['skills'] = self._improve_skills_section(
                skills_text,
                language
            )
        
        # 4. Generate bullet point suggestions
        if analysis['bullets']['bullet_count'] < 5:
            print("  • Generating bullet point suggestions...")
            improvements['bullet_suggestions'] = self._generate_bullet_suggestions(
                experience_text if experience_text else analysis['clean_text'],
                language
            )
        
        return improvements
    
    def _improve_experience_section(self, text: str, verb_analysis: Dict, 
                                   metrics_analysis: Dict, language: str) -> Dict:
        """
        Améliore spécifiquement la section expérience
        """
        lang_instructions = {
            'en': 'Respond in English',
            'fr': 'Réponds en français'
        }
        
        weak_verbs = verb_analysis.get('weak_verbs', [])
        passive_verbs = verb_analysis.get('passive_verbs', [])
        has_metrics = metrics_analysis.get('has_metrics', False)
        
        prompt = f"""
You are an expert CV writer specializing in the MENA and Sub-Saharan African job markets.

ORIGINAL TEXT:
{text}

ISSUES IDENTIFIED:
- Weak/passive verbs found: {', '.join(weak_verbs + passive_verbs)[:100]}
- Has quantifiable metrics: {'Yes' if has_metrics else 'No - MUST ADD'}

YOUR TASK:
Rewrite this experience section following these rules:

1. START EACH BULLET with a STRONG action verb (past tense): Led, Developed, Implemented, Achieved, Optimized, etc.
2. ADD QUANTIFIABLE RESULTS wherever possible:
   - Numbers: "Managed team of 8"
   - Percentages: "Increased efficiency by 30%"
   - Scale: "Serving 10,000+ users"
   - Time: "Reduced processing time from 5h to 2h"
3. USE the XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]"
4. KEEP it concise: 1-2 lines per bullet point
5. FOCUS on impact and results, not just tasks
6. CONTEXT: Adapt language for African/MENA employers

{lang_instructions[language]}

IMPROVED VERSION:
"""
        
        response = self.groq_client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=1500
        )
        
        improved_text = response.choices[0].message.content
        
        return {
            'original': text[:],
            'improved': improved_text,
            'changes_made': [
                'Replaced weak verbs with action verbs',
                'Added quantifiable metrics' if not has_metrics else 'Enhanced metrics',
                'Improved bullet point structure',
                'Emphasized impact and results'
            ]
        }
    
    def _generate_professional_summary(self, analysis: Dict, language: str) -> Dict:
        """
        Génère un résumé professionnel basé sur le CV
        """
        experience_years = analysis['experience_duration']['total_experience_years']
        
        # Extraire les compétences mentionnées
        text_sample = analysis['clean_text'][:1000]
        
        lang_instructions = {
            'en': 'Write in English',
            'fr': 'Écris en français'
        }
        
        prompt = f"""
Based on this CV excerpt, create a compelling professional summary (3-4 sentences):

CV EXCERPT:
{text_sample}

EXPERIENCE: {experience_years} years

REQUIREMENTS:
1. Start with job title/role and years of experience(if relevant else say he is junior without saying 0 years of experience)
2. Highlight 2-3 key strengths or achievements
3. Mention 2-3 core technical/professional skills
4. End with career goal or value proposition
5. Make it relevant for MENA/Sub-Saharan Africa job market
6. Be specific and impactful, avoid generic phrases
7. Keep it under 80 words

{lang_instructions[language]}

PROFESSIONAL SUMMARY:
"""
        
        response = self.groq_client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=300
        )
        
        return {
            'generated_summary': response.choices[0].message.content,
            'placement': 'Add at the top of your CV, right after contact information'
        }
    
    def _improve_skills_section(self, text: str, language: str) -> Dict:
        """
        Améliore la présentation des compétences
        """
        lang_instructions = {
            'en': 'Respond in English',
            'fr': 'Réponds en français'
        }
        
        prompt = f"""
Reorganize and enhance this skills section for maximum impact:

ORIGINAL:
{text}

REQUIREMENTS:
1. Group skills into clear categories (Technical, Languages, Tools, Soft Skills, etc.)
2. List most relevant/strongest skills first
3. Remove redundant or outdated skills
4. Use consistent formatting
5. Keep it scannable and ATS-friendly

{lang_instructions[language]}

FORMAT:
**Category Name**
- Skill 1 (Proficiency level)
- Skill 2 (Proficiency level)

IMPROVED SKILLS SECTION:
"""
        
        response = self.groq_client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.6,
            max_tokens=800
        )
        
        return {
            'original': text[:300],
            'improved': response.choices[0].message.content
        }
    
    def _generate_bullet_suggestions(self, text: str, language: str) -> List[str]:
        """
        Génère des exemples de bullet points améliorés
        """
        lang_instructions = {
            'en': 'Respond in English',
            'fr': 'Réponds en français'
        }
        
        prompt = f"""
Based on this experience text, generate 5 PERFECT bullet points that demonstrate impact:

TEXT:
{text[:800]}

RULES:
1. Each bullet MUST follow: [Strong Action Verb] + [What you did] + [Quantifiable Result]
2. Use numbers, percentages, scale, timeframes
3. Show IMPACT, not just responsibilities
4. Keep each bullet 15-25 words
5. Use past tense action verbs
6. Make them ATS-friendly
7. Relevant for African/MENA job market

{lang_instructions[language]}

PROVIDE EXACTLY 5 BULLET POINTS:
"""
        
        response = self.groq_client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.8,
            max_tokens=500
        )
        
        bullets = response.choices[0].message.content.strip().split('\n')
        bullets = [b.strip() for b in bullets if b.strip() and not b.strip().startswith('#')]
        
        return bullets[:5]
    
    def _generate_latex_resume(self, analysis_result: Dict, 
                               improvements: Dict, language: str) -> str:
        """
        Génère un CV complet en LaTeX basé sur le template
        """
        analysis = analysis_result['full_analysis']['analysis']
        
        # Préparer les informations pour le prompt
        issues_summary = self._format_issues_for_prompt(analysis_result)
        original_cv_content = analysis['clean_text'][:3000]  # Limiter la taille
        
        lang_instructions = {
            'en': 'Generate the CV content in English',
            'fr': 'Génère le contenu du CV en français'
        }
        
        # Extraire les informations de contact
        contacts = analysis['contacts']
        name = self._extract_name(analysis['raw_text'])
        
        # Créer un exemple concret du format attendu
        format_example = r"""
EXAMPLE OF EXACT FORMAT TO FOLLOW:

\begin{center}
    {\Large \textbf{John DOE}}\\[0.3em]
    \faMapMarker\ City, Country | \quad
    \faEnvelope~email@example.com \quad | \quad 
    \faPhone*~+123 456789 \quad |
    \href{https://linkedin.com/in/profile}{\raisebox{-0.05\height} \faLinkedin\ Name}
\end{center}
\vspace{0.2em}

\section*{Profile}
Brief professional summary in 2-3 sentences...

\section*{Education}
\textbf{University Name} \hfill 2021 -- Present \\
Degree Title \\
Additional Info \\
\textbf{High School Name} \hfill 2017 -- 2021 \\
Diploma Title

\section*{Professional Experience}
\textbf{Job Title} \hfill Month Year -- Month Year \\
\textit{\small Company Name, City} \vspace{-2mm}
\begin{itemize}[itemsep=-0.2em] 
    \item Achievement with metrics (increased X by Y%)
    \item Another achievement with impact
\end{itemize}
\vspace{1mm}

\section*{Academic Projects}
\textbf{Project Title} \hfill Month Year -- Month Year
\begin{itemize}[itemsep=-0.2em]
    \item Developed X achieving Y% accuracy
    \item Implemented Z resulting in performance improvement
\end{itemize}

\section*{Associative Experience}
Position Title -- Organization Name \hfill Month Year -- Month Year

\section*{Skills}
\cvitem{}{%
  \textbf{Category 1:} Skill1, Skill2, Skill3 \\
  \textbf{Category 2:} Skill4, Skill5 \\
}

\section*{Languages}
\begin{center}
\textbf{Language1}: Level \hspace{1em} \textbf{Language2}: Level
\end{center}

\section*{Certifications and Awards}
\begin{itemize}[itemsep=-0.2em] 
    \item Award or certification name
    \item Another certification
\end{itemize}
"""
        
        prompt = f"""
You are an expert LaTeX CV writer. Generate a CV that matches EXACTLY the reference format below.

REFERENCE FORMAT (FOLLOW THIS EXACTLY):
{format_example}

ORIGINAL CV CONTENT:
{original_cv_content}

CONTACT INFORMATION EXTRACTED:
- Name: {name}
- Email: {contacts.get('emails', [''])[0] if contacts.get('emails') else 'email@example.com'}
- Phone: {contacts.get('phones', [''])[0] if contacts.get('phones') else '+000 00000000'}
- Location: {contacts.get('location', 'City, Country')}
- LinkedIn: {contacts.get('linkedin', [''])[0] if contacts.get('linkedin') else ''}
- GitHub: {contacts.get('github', [''])[0] if contacts.get('github') else ''}

DETECTED ISSUES TO FIX:
{issues_summary}

IMPROVEMENTS GENERATED:
{self._format_improvements_for_prompt(improvements)}

CRITICAL FORMATTING RULES (MUST FOLLOW):
1. Header: Use \\begin{{center}} with name, icons, and contact info on ONE centered block
2. Education: NO itemize lists! Use \\textbf{{University}} \\hfill dates \\\\ Degree \\\\
3. Professional Experience: 
   - \\textbf{{Job Title}} \\hfill Month Year -- Month Year \\\\
   - \\textit{{\\small Company, City}} \\vspace{{-2mm}}
   - Then \\begin{{itemize}}[itemsep=-0.2em] for achievements
   - End with \\vspace{{1mm}} between positions
4. Skills: Use \\cvitem{{}}{{%
   \\textbf{{Category:}} skills \\\\
}} NOT itemize lists!
5. Languages: \\begin{{center}} with \\hspace{{1em}} separators
6. Dates: ALWAYS use \\hfill to align dates to the right
7. Apply improvements: strong verbs, add metrics (percentages, numbers)
8. NO double \\begin{{document}}
9. Escape special characters: C++ becomes C\\++, & becomes \\&

{lang_instructions[language]}

Generate ONLY the content (no \\documentclass, no preamble, just the body):
"""
        
        print("  🤖 Generating LaTeX CV with AI...")
        response = self.groq_client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,  # Lower to respect format
            max_tokens=4000
        )
        
        latex_content = response.choices[0].message.content.strip()
        
        # Clean content (remove markdown tags if present)
        latex_content = latex_content.replace('```latex', '').replace('```', '')
        
        # Clean double \begin{document} if present
        latex_content = latex_content.replace(r'\begin{document}', '').replace(r'\end{document}', '')

        # Insert content into template
        full_latex = self.LATEX_TEMPLATE.replace('%CONTENT_PLACEHOLDER%', latex_content)
        
        return full_latex
    
    def _extract_name(self, text: str) -> str:
        """
        Extrait le nom de la personne du CV
        """
        # Le nom est généralement dans les premières lignes, en majuscules ou avec des majuscules
        lines = text.split('\n')[:10]
        
        for line in lines:
            line = line.strip()
            # Chercher une ligne avec des mots capitalisés (probablement le nom)
            if line and len(line.split()) <= 4:  # Nom typiquement 2-4 mots
                words = line.split()
                if all(word[0].isupper() if word else False for word in words):
                    return line
        
        return "Full Name"
    
    def _format_issues_for_prompt(self, analysis_result: Dict) -> str:
        """
        Formate les problèmes détectés pour le prompt LLM
        """
        issues = []
        high_priority = analysis_result['issues_to_fix']['high_priority']
        
        for issue in high_priority[:5]:
            issues.append(f"- {issue['issue']}: {issue['recommendation']}")
        
        return '\n'.join(issues) if issues else 'No critical issues detected'
    
    def _format_improvements_for_prompt(self, improvements: Dict) -> str:
        """
        Formate les améliorations pour le prompt LLM
        """
        formatted = []
        
        if 'professional_summary' in improvements:
            formatted.append(f"Professional Summary:\n{improvements['professional_summary']['generated_summary']}")
        
        if 'experience' in improvements:
            formatted.append(f"\nImproved Experience Section:\n{improvements['experience']['improved'][:500]}")
        
        if 'skills' in improvements:
            formatted.append(f"\nImproved Skills:\n{improvements['skills']['improved'][:300]}")
        
        return '\n'.join(formatted) if formatted else 'No specific improvements'
    
    def _generate_final_report(self, analysis: Dict, improvements: Dict) -> str:
        """
        Generates final report with all improvements
        """
        report = []
        report.append("=" * 80)
        report.append("📋 CV IMPROVEMENT REPORT - UtopiaHire")
        report.append("=" * 80)
        report.append("")
        
        # Score and level
        report.append(f"🎯 INITIAL SCORE: {analysis['score']}/100 - {analysis['level']}")
        report.append("")
        
        # Critical issues resolved
        high_priority = analysis['issues_to_fix']['high_priority']
        if high_priority:
            report.append("✅ CRITICAL ISSUES ADDRESSED:")
            for issue in high_priority[:5]:
                report.append(f"  • {issue['issue']}")
            report.append("")
        
        # Improvements by section
        report.append("📄 IMPROVEMENTS MADE:")
        report.append("")
        # Améliorations par section
        report.append("🔄 AMÉLIORATIONS APPORTÉES:")
        report.append("")
        
        if 'professional_summary' in improvements:
            report.append("1️⃣  PROFESSIONAL SUMMARY (NEW)")
            report.append("-" * 60)
            report.append(improvements['professional_summary']['generated_summary'])
            report.append("")
        
        if 'experience' in improvements:
            report.append("2️⃣  EXPERIENCE SECTION (IMPROVED)")
            report.append("-" * 60)
            report.append("Changes made:")
            for change in improvements['experience']['changes_made']:
                report.append(f"  ✓ {change}")
            report.append("")
            report.append("IMPROVED TEXT:")
            report.append(improvements['experience']['improved'])
            report.append("")
        
        if 'skills' in improvements:
            report.append("3️⃣  SKILLS (REORGANIZED)")
            report.append("-" * 60)
            report.append(improvements['skills']['improved'])
            report.append("")
        
        if 'bullet_suggestions' in improvements:
            report.append("4️⃣  OPTIMIZED BULLET POINT EXAMPLES")
            report.append("-" * 60)
            for i, bullet in enumerate(improvements['bullet_suggestions'], 1):
                report.append(f"  {i}. {bullet}")
            report.append("")
        
        # Recommended next steps
        report.append("🎬 NEXT STEPS:")
        medium_priority = analysis['issues_to_fix']['medium_priority']
        if medium_priority:
            for i, issue in enumerate(medium_priority[:3], 1):
                report.append(f"  {i}. {issue['recommendation']}")
        
        report.append("")
        report.append("=" * 80)
        report.append("✨ Improvements generated by UtopiaHire - Powered by NLP + LLM")
        report.append("=" * 80)
        
        return "\n".join(report)
    
    def compile_latex_to_pdf(self, latex_content: str, output_path: str) -> bool:
        """
        Compiles LaTeX file to PDF
        
        Args:
            latex_content: Complete LaTeX content
            output_path: Output path for PDF (without extension)
            
        Returns:
            True if compilation succeeds, False otherwise
        """
        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            tex_file = os.path.join(temp_dir, 'resume.tex')
            
            # Write .tex file
            with open(tex_file, 'w', encoding='utf-8') as f:
                f.write(latex_content)
            
            try:
                print("  🔨 Compiling LaTeX...")
                # Compile with pdflatex
                result = subprocess.run(
                    ['pdflatex', '-interaction=nonstopmode', '-output-directory', temp_dir, tex_file],
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                
                # Check if PDF was created
                pdf_file = os.path.join(temp_dir, 'resume.pdf')
                if os.path.exists(pdf_file):
                    # Copy PDF to final destination
                    import shutil
                    final_pdf = f"{output_path}.pdf"
                    shutil.copy(pdf_file, final_pdf)
                    print(f"  ✅ PDF generated successfully: {final_pdf}")
                    return True
                else:
                    print("  ❌ Error: PDF not generated")
                    print(f"  LaTeX log:\n{result.stdout}")
                    return False
                    
            except subprocess.TimeoutExpired:
                print("  ❌ Timeout during LaTeX compilation")
                return False
            except FileNotFoundError:
                print("  ❌ pdflatex not found. Install TeX Live or MiKTeX")
                print("     Ubuntu/Debian: sudo apt-get install texlive-full")
                print("     macOS: brew install mactex")
                return False
            except Exception as e:
                print(f"  ❌ Error during compilation: {str(e)}")
                return False

    def save_improvements(self, result: Dict, output_dir: str = "."):
        """
        Saves all results to files
        """
        # Create output folder
        os.makedirs(output_dir, exist_ok=True)
        
        # 1. Complete text report
        report_path = os.path.join(output_dir, "improvement_report.txt")
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(result['final_report'])
        print(f"✅ Report saved: {report_path}")
        
        # 2. LaTeX file
        latex_path = os.path.join(output_dir, "improved_resume.tex")
        with open(latex_path, 'w', encoding='utf-8') as f:
            f.write(result['latex_content'])
        print(f"✅ LaTeX file saved: {latex_path}")
        
        # 3. Compile to PDF
        pdf_base_path = os.path.join(output_dir, "improved_resume")
        pdf_success = self.compile_latex_to_pdf(result['latex_content'], pdf_base_path)
        
        if not pdf_success:
            print("⚠️  PDF could not be generated automatically.")
            print(f"   You can manually compile the file: {latex_path}")
        
        # 4. Structured JSON for integration
        json_path = os.path.join(output_dir, "improvements.json")
        json_data = {
            'original_score': result['original_analysis']['score'],
            'level': result['original_analysis']['level'],
            'improvements': result['improvements'],
            'high_priority_issues': result['original_analysis']['issues_to_fix']['high_priority']
        }
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(json_data, f, indent=2, ensure_ascii=False)
        print(f"✅ JSON data saved: {json_path}")
        
        # 5. Separate improved sections (for copy-paste)
        if 'experience' in result['improvements']:
            exp_path = os.path.join(output_dir, "improved_experience.txt")
            with open(exp_path, 'w', encoding='utf-8') as f:
                f.write(result['improvements']['experience']['improved'])
            print(f"✅ Improved experience: {exp_path}")
        
        if 'professional_summary' in result['improvements']:
            summary_path = os.path.join(output_dir, "professional_summary.txt")
            with open(summary_path, 'w', encoding='utf-8') as f:
                f.write(result['improvements']['professional_summary']['generated_summary'])
            print(f"✅ Professional summary: {summary_path}")



# ============================================
# EXEMPLE D'UTILISATION COMPLÈTE
# ============================================

def main():
    """
    Complete usage example of the system
    """
    import sys
    
    print("=" * 80)
    print("🚀 UtopiaHire - Resume Improver with LaTeX Generation")
    print("   Intelligent CV improvement system (NLP + LLM + LaTeX)")
    print("=" * 80)
    print("")
    
    # Configuration
    if len(sys.argv) < 3:
        print("Usage: python resume_improver.py <cv.pdf> <groq_api_key> [language]")
        print("\nExamples:")
        print("  python resume_improver.py my_cv.pdf gsk_xxxxx en")
        print("  python resume_improver.py my_cv.pdf gsk_xxxxx fr")
        print("\nTo get a free Groq API key:")
        print("  1. Visit https://console.groq.com")
        print("  2. Create a free account")
        print("  3. Generate an API key")
        print("\nLaTeX dependencies:")
        print("  Ubuntu/Debian: sudo apt-get install texlive-full texlive-fonts-extra")
        print("  macOS: brew install mactex")
        print("  Windows: Install MiKTeX (https://miktex.org)")
        return
    
    pdf_path = sys.argv[1]
    api_key = sys.argv[2]
    language = sys.argv[3] if len(sys.argv) > 3 else 'en'
    
    try:
        # Create improver
        improver = ResumeImprover(api_key)
        
        # Analyze and improve
        print(f"\n📄 Processing CV: {pdf_path}")
        print(f"🌍 Language: {'French' if language == 'fr' else 'English'}")
        print("-" * 80)
        
        result = improver.analyze_and_improve(pdf_path, language)
        
        # Display report
        print("\n" + result['final_report'])
        
        # Save results
        print("\n💾 Saving results...")
        output_dir = pdf_path.replace('.pdf', '_improved')
        improver.save_improvements(result, output_dir)
        
        print(f"\n✨ Processing completed successfully!")
        print(f"📁 All files are in: {output_dir}/")
        print(f"📄 Improved CV: {output_dir}/improved_resume.pdf")
        print(f"📝 LaTeX file: {output_dir}/improved_resume.tex")
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()