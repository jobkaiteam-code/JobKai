"""
Resume Analyzer & Reviewer - Système NLP complet
Entrée: PDF de CV
Sortie: Analyse détaillée + Recommandations
"""

import re
import spacy
from collections import Counter
from datetime import datetime
import PyPDF2
import fitz
import pdfplumber
from typing import Dict, List, Tuple
import json

# ============================================
# 1. EXTRACTION DU TEXTE DEPUIS PDF
# ============================================

class PDFExtractor:
    """Extrait le texte d'un fichier PDF de CV"""
    
    @staticmethod
    def extract_text_from_pdf(pdf_path: str) -> str:
        """
        Extrait tout le texte d'un PDF
        Args:
            pdf_path: Chemin vers le fichier PDF
        Returns:
            Texte brut extrait
        """
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                for page in pdf_reader.pages:
                    text += page.extract_text()
                return text
        except Exception as e:
            raise Exception(f"Error while extracting PDF: {str(e)}")
    
    @staticmethod
    def clean_text(text: str) -> str:
        """Nettoie le texte extrait"""
        # Supprime les espaces multiples
        text = re.sub(r'\s+', ' ', text)
        # Supprime les caractères spéciaux problématiques
        text = re.sub(r'[^\w\s\n@.\-+(),/;:]', '', text)
        return text.strip()


# ============================================
# 2. EXTRACTION D'INFORMATIONS DE CONTACT
# ============================================

class ContactExtractor:
    """Extrait les informations de contact du CV"""
    
    @staticmethod
    def extract_email(text: str) -> List[str]:
        """Extrait les adresses email en nettoyant les préfixes parasites"""
        
        # Pattern pour détecter les emails
        pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(pattern, text)
        
        cleaned_emails = []
        for email in emails:
            # Liste des préfixes parasites à supprimer(les parasites proviennent d'une mauvaise extraction du contenu du cv)
            parasites = ['envelpe', 'envelope', 'phone', 'phonealt', 'linkedin', 'mail', 'email']
            
            email_lower = email.lower()
            cleaned = email
            
            # Vérifier et supprimer les préfixes parasites
            for parasite in parasites:
                if email_lower.startswith(parasite):
                    # Supprimer le préfixe parasite
                    cleaned = email[len(parasite):]
                    break
            
            # Ajouter l'email nettoyé s'il est valide
            if cleaned and '@' in cleaned and re.match(r'^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$', cleaned):
                cleaned_emails.append(cleaned.lower())
        
        return list(set(cleaned_emails))
    @staticmethod
    def extract_phone(text: str) -> List[str]:
        """Extrait les numéros de téléphone"""
        patterns = [
            r'\+?\d{1,4}[-.\s]?\(?\d{1,3}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}',
            r'\(\d{3}\)\s*\d{3}-\d{4}',
            r'\d{3}-\d{3}-\d{4}'
        ]
        phones = []
        for pattern in patterns:
            phones.extend(re.findall(pattern, text))
        return list(set(phones))
    
    @staticmethod
    def extract_linkedin(text: str) -> List[str]:
        """Extrait les profils LinkedIn"""
        pattern = r'(?:https?://)?(?:www\.)?linkedin\.com/in/[\w\-]+'
        return re.findall(pattern, text, re.IGNORECASE)
    @staticmethod
    def extract_linkedin_from_pdf(pdf_path: str) -> List[str]:
        """Extrait les liens LinkedIn intégrés (même cachés derrière du texte)"""
        links = []
        try:
            doc = fitz.open(pdf_path)
            for page in doc:
                for link in page.get_links():
                    if "uri" in link and "linkedin.com/in/" in link["uri"].lower():
                        links.append(link["uri"])
            doc.close()
        except Exception as e:
            print(f"[PDF Extraction ErrorF] {e}")
        return list(set(links))
    
    @staticmethod
    def extract_github(text: str) -> List[str]:
        """Extrait les profils GitHub"""
        pattern = r'(?:https?://)?(?:www\.)?github\.com/[\w\-]+'
        return re.findall(pattern, text, re.IGNORECASE)
    
    @staticmethod
    def extract_all_contacts(text: str,pdf_path) -> Dict:
        """Extrait toutes les informations de contact"""
        linkedin_links = ContactExtractor.extract_linkedin(text)
        if not linkedin_links and pdf_path:
            linkedin_links = ContactExtractor.extract_linkedin_from_pdf(pdf_path)
        return {
            'emails': ContactExtractor.extract_email(text),
            'phones': ContactExtractor.extract_phone(text),
            'location': ContactExtractor.extract_location(text),
            'linkedin': linkedin_links,
            'github': ContactExtractor.extract_github(text)
        }


    @staticmethod
    def extract_location(text: str) :
        """
        Extrait la localisation (ville, pays) du CV
        
        Returns:
            Dict avec 'raw_locations', 'cities', 'countries'
        """
        import re
        
        # Liste de pays communs (MENA + Sub-Saharan Africa + autres)
        COUNTRIES = {
            # MENA
            'tunisia', 'tunisie', 'morocco', 'maroc', 'algeria', 'algérie', 'egypt', 'égypte',
            'libya', 'libye', 'mauritania', 'mauritanie', 'lebanon', 'liban', 'jordan', 'jordanie',
            'syria', 'syrie', 'iraq', 'irak', 'saudi arabia', 'arabie saoudite', 'uae', 'emirates',
            'kuwait', 'koweït', 'qatar', 'oman', 'bahrain', 'bahrein', 'yemen', 'yémen',
            'palestine', 'israel', 'israël',
            
            # Sub-Saharan Africa
            'nigeria', 'nigéria', 'ethiopia', 'éthiopie', 'kenya', 'ghana', 'tanzania', 'tanzanie',
            'uganda', 'ouganda', 'south africa', 'afrique du sud', 'senegal', 'sénégal',
            'ivory coast', 'côte d\'ivoire', 'cameroon', 'cameroun', 'madagascar', 'mali',
            'burkina faso', 'niger', 'rwanda', 'somalia', 'somalie', 'zimbabwe', 'zambia', 'zambie',
            'mozambique', 'botswana', 'namibia', 'namibie', 'gabon', 'angola', 'congo',
            'democratic republic of congo', 'rdc', 'benin', 'bénin', 'togo', 'chad', 'tchad',
            
            # Autres pays fréquents
            'france', 'canada', 'usa', 'united states', 'états-unis', 'uk', 'united kingdom',
            'royaume-uni', 'germany', 'allemagne', 'spain', 'espagne', 'italy', 'italie',
            'belgium', 'belgique', 'switzerland', 'suisse', 'netherlands', 'pays-bas'
        }
        
        # Villes majeures MENA/Africa (exemples, à étendre)
        MAJOR_CITIES = {
            # Tunisia
            'tunis', 'sfax', 'sousse', 'bizerte', 'kairouan', 'gabès', 'ariana',
            # Morocco
            'casablanca', 'rabat', 'fès', 'marrakech', 'agadir', 'tanger', 'meknès',
            # Algeria
            'algiers', 'alger', 'oran', 'constantine', 'annaba', 'blida',
            # Egypt
            'cairo', 'le caire', 'alexandria', 'alexandrie', 'giza', 'shubra el-kheima',
            # Nigeria
            'lagos', 'abuja', 'kano', 'ibadan', 'port harcourt',
            # Kenya
            'nairobi', 'mombasa', 'kisumu', 'nakuru',
            # South Africa
            'johannesburg', 'cape town', 'le cap', 'durban', 'pretoria',
            # Ghana
            'accra', 'kumasi', 'tamale', 'takoradi',
            # Senegal
            'dakar', 'touba', 'thiès', 'saint-louis',
            # Cameroon
            'yaoundé', 'douala', 'garoua', 'bamenda',
            # Ethiopia
            'addis ababa', 'dire dawa', 'mekelle',
            # Tanzania
            'dar es salaam', 'dodoma', 'mwanza', 'arusha',
            # Uganda
            'kampala', 'gulu', 'lira', 'mbarara'
        }
        
        locations_found = []
        cities_found = []
        countries_found = []

        # Pattern 1: Format "Ville, Pays" ou "Ville - Pays"
        pattern1 = r'([A-Z][a-zàâäéèêëïîôùûü\s\-\'\.]+)[,\-]\s*([A-Z][a-zàâäéèêëïîôùûü\s]+)'
        matches1 = re.findall(pattern1, text)

        for city, country in matches1:
            city = city.strip()
            country = country.strip()
            if country.lower() in COUNTRIES:
                locations_found.append(f"{city}, {country}")
                cities_found.append(city)
                countries_found.append(country)

        # Pattern 2: Ville seule
        for city in MAJOR_CITIES:
            if re.search(r'\b' + re.escape(city) + r'\b', text, re.IGNORECASE):
                city_title = city.title()
                if city_title not in cities_found:
                    locations_found.append(city_title)
                    cities_found.append(city_title)

        # Pattern 3: Pays seul
        for country in COUNTRIES:
            if re.search(r'\b' + re.escape(country) + r'\b', text, re.IGNORECASE):
                country_title = country.title()
                if country_title not in countries_found:
                    locations_found.append(country_title)
                    countries_found.append(country_title)

        # ✅ Sécurisation : toujours renvoyer une chaîne
        if isinstance(locations_found, str):
            # Si jamais c'est une string par erreur, on la retourne telle quelle
            return locations_found.strip()
        elif locations_found:
            # Sinon on prend le premier élément de la liste
            return locations_found[0].strip()
        else:
            return ""


# ============================================
# 3. DÉTECTION DE SECTIONS
# ============================================

import re
from typing import Dict

class SectionDetector:
    """Détecte et extrait les sections principales du CV"""
    
    SECTION_PATTERNS = {
        'experience': [
            r'^\s*(?:professional|work|internship|employment|career)\s*(?:history|experience)\b',
            r'^\s*(?:employment|work|career)\s+history\b',
            r'^\s*(?:experience|experiences)\b',
            r'^\s*(?:exp[eé]rience(?:s)?(?:\s+professionnelle)?|historique\s+professionnel)\b',
            r'^\s*(?:poste[s]?|positions?)\b'
        ],
        'education': [
            r'^\s*(?:education|educational|academic)\b',
            r'^\s*(?:academic\s+(?:background|qualifications))\b',
            r'^\s*(?:qualifications|degrees|education)\b',
            r'^\s*(?:formation|dipl[oô]mes|[eé]tudes)\b'
        ],
        'skills': [
            r'^\s*(?:technical\s+)?skills\b',
            r'^\s*(?:competenc(?:ies|es)|comp[eé]tences)\b',
            r'^\s*(?:expertise|technical\s+skills)\b',
            r'^\s*(?:skills\s+and\s+tools|outils)\b'
        ],
        'projects': [
            r'^\s*(?:academic\s+projects?|key\s+projects?|projects?)\b',
            r'^\s*(?:portfolio|portefeuille|projets)\b',
            r'^\s*(?:projets\s+acad[eé]miques|projets)\b'
        ],
        'certifications': [
            r'^\s*(?:professional\s+)?certifications?\b',
            r'^\s*(?:certificates?|certificats?)\b',
            r'^\s*(?:licenses?|licences?)\b',
            r'^\s*(?:credentials)\b'
        ],
        'summary': [
            r'^\s*(?:professional\s+)?summary\b',
            r'^\s*(?:profile|profil)\b',
            r'^\s*(?:objective|objective\s+statement)\b',
            r'^\s*(?:about\s+me|a\s+propos)\b',
            r'^\s*(?:r[ée]sum[ée]|r[eé]sum[e]?)\b'
        ],
        'associative': [
            r'^\s*(?:associative\s+experience|associative\s+life)\b',
            r'^\s*(?:vie\s+associative|vie\s+d\'association|association(?:s)?)\b',
            r'^\s*(?:volunteer\s+experience|volunteering|b[eé]n[eé]volat|volontariat|volunteer)\b',
            r'^\s*(?:activities|activit[eé]s|community\s+service)\b'
        ],
        'languages': [
            r'^\s*(?:languages|langues)\b',
            r'^\s*(?:language\s+skills|comp[eé]tences\s+linguistiques)\b'
        ]
    }
    
    
    @staticmethod
    def detect_sections(text: str) -> Dict[str, bool]:
        """Vérifie la présence de chaque section"""
        sections_found = {}
        for section, patterns in SectionDetector.SECTION_PATTERNS.items():
            found = any(re.search(pattern, text, re.IGNORECASE | re.MULTILINE) for pattern in patterns)
            sections_found[section] = found
        return sections_found
    
    @staticmethod
    def extract_section_content(text: str, section_name: str) -> str:
        """Extrait le contenu d'une section spécifique"""
        patterns = SectionDetector.SECTION_PATTERNS.get(section_name, [])
        
        for pattern in patterns:
            match = re.search(pattern, text, re.IGNORECASE | re.MULTILINE)
            if match:
                start = match.end()
                min_pos = len(text)
                # Cherche la section suivante
                for other_section, other_patterns in SectionDetector.SECTION_PATTERNS.items():
                    if other_section != section_name:
                        for other_pattern in other_patterns:
                            next_match = re.search(other_pattern, text[start:], re.IGNORECASE | re.MULTILINE)
                            if next_match:
                                pos = start + next_match.start()
                                if pos < min_pos:
                                    min_pos = pos
                section_content = text[start:min_pos].strip()
                print(f"[DEBUG] Section '{section_name}' found with pattern '{pattern}':\n{section_content}\n{'-'*50}")
                return section_content
        return ""



# ============================================
# 4. ANALYSE DE QUALITÉ (NLP avec spaCy)
# ============================================

class QualityAnalyzer:
    """Analyse la qualité du contenu du CV avec NLP"""
    
    def __init__(self):
        # Charger le modèle spaCy
        try:
            self.nlp = spacy.load("en_core_web_sm")
        except:
            print("spaCy model not found. Install it using: python -m spacy download en_core_web_sm")
            self.nlp = None
    
    # Listes de référence
    WEAK_VERBS = {
        'was', 'were', 'is', 'are', 'been', 'be', 'being',
        'had', 'has', 'have', 'having',
        'responsible for', 'tasked with', 'worked on', 'involved in',
        'helped', 'assisted', 'participated'
    }
    
    STRONG_ACTION_VERBS = {
        'achieved', 'accelerated', 'accomplished', 'delivered', 'designed',
        'developed', 'directed', 'engineered', 'established', 'executed',
        'generated', 'implemented', 'improved', 'increased', 'initiated',
        'launched', 'led', 'managed', 'optimized', 'orchestrated',
        'pioneered', 'reduced', 'resolved', 'spearheaded', 'streamlined',
        'transformed', 'built', 'created', 'drove', 'enhanced','used',
        'influenced', 'negotiated', 'secured', 'shaped', 'won',
        'conducted','participated'
    }
    
    FILLER_WORDS = {
        'very', 'really', 'just', 'actually', 'basically', 'literally',
        'obviously', 'clearly', 'simply', 'extremely', 'quite', 'rather'
    }
    
    def analyze_verbs(self, text: str) -> Dict:
        """Analyse l'utilisation des verbes"""
        if not self.nlp:
            return {}
        
        doc = self.nlp(text.lower())
        
        # Détecter les verbes passifs
        passive_verbs = []
        for token in doc:
            if token.dep_ == "auxpass":
                passive_verbs.append(token.head.text)
        
        # Détecter les verbes faibles
        weak_verbs_found = []
        for verb in self.WEAK_VERBS:
            if verb in text.lower():
                weak_verbs_found.append(verb)
        
        # Détecter les verbes d'action forts
        strong_verbs_found = []
        for verb in self.STRONG_ACTION_VERBS:
            # Autorise un caractère non alphanumérique avant le mot
            pattern = r'(?:^|[^a-zA-Z0-9])' + re.escape(verb) + r'\b'
            if re.search(pattern, text, re.IGNORECASE):
                strong_verbs_found.append(verb)

        
        return {
            'passive_verbs': passive_verbs,
            'passive_count': len(passive_verbs),
            'weak_verbs': list(set(weak_verbs_found)),
            'weak_count': len(set(weak_verbs_found)),
            'strong_verbs': list(set(strong_verbs_found)),
            'strong_count': len(set(strong_verbs_found))
        }
    
    def detect_quantifiable_achievements(self, text: str) -> Dict:
        """Détecte la présence de réalisations quantifiables"""
        metrics_patterns = [
        r'\d+(\.\d+)?%',  # Pourcentages
        r'\$\d+[KMB]?',  # Montants en dollars
        r'\d+\+?\s*(?:million|thousand|billion|users|customers|clients)',  # Grands nombres
        # Verbes suivis éventuellement de mots et du chiffre
        r'\b(?:increased|decreased|improved|reduced|grew|saved|reducing|boosted|cut)\b(?:\s+\w+){0,5}\s+by\s+\d+(\.\d+)?%?',
        r'\d+x',  # Multiplicateurs
        r'top\s+\d+',
        r'#\d+',
        r'\d+\s+(?:people|members|engineers|developers|employees)'
    ]
        
        metrics_found = []
        for pattern in metrics_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            metrics_found.extend(matches)
        
        return {
            'has_metrics': len(metrics_found) > 0,
            'metrics_count': len(metrics_found),
            'metrics_examples': metrics_found[:5]
        }
    
    def analyze_bullet_points(self, text: str) -> Dict:
        """Analyse les bullet points"""
        # Détecter les bullet points
        bullet_patterns = [
            r'^\s*[•\-\*]\s*.+',   # puces classiques
            r'^\s*\d+\.\s+.+',     # numérotation 1. 2. 3.
            r'^\s*[a-z]\)\s+.+',   # a) b) c)
        ]
        bullets = []
        
        for pattern in bullet_patterns:
            bullets.extend(re.findall(pattern, text, re.MULTILINE))
        
        # Analyser la longueur des bullet points
        lines = text.split('\n')
        bullet_lines = [line for line in lines if any(re.match(p, line.strip()) for p in bullet_patterns)]
        
        avg_length = sum(len(line.split()) for line in bullet_lines) / len(bullet_lines) if bullet_lines else 0
        
        return {
            'bullet_count': len(bullets),
            'has_bullets': len(bullets) > 0,
            'avg_bullet_length': round(avg_length, 1),
            'optimal_length': 10 <= avg_length <= 20  # Longueur optimale
        }
    
    def check_filler_words(self, text: str) -> Dict:
        """Détecte les mots de remplissage inutiles"""
        words = text.lower().split()
        fillers_found = [word for word in words if word in self.FILLER_WORDS]
        
        return {
            'filler_count': len(fillers_found),
            'filler_words': list(set(fillers_found)),
            'has_too_many': len(fillers_found) > 5
        }
    
    def analyze_sentence_structure(self, text: str) -> Dict:
        """Analyse la structure des phrases"""
        if not self.nlp:
            return {}
        
        doc = self.nlp(text)
        sentences = list(doc.sents)
        
        # Longueur moyenne des phrases
        avg_sentence_length = sum(len(sent) for sent in sentences) / len(sentences) if sentences else 0
        
        # Phrases trop longues (>30 mots)
        long_sentences = [str(sent) for sent in sentences if len(sent) > 30]
        
        return {
            'sentence_count': len(sentences),
            'avg_sentence_length': round(avg_sentence_length, 1),
            'long_sentences_count': len(long_sentences),
            'has_long_sentences': len(long_sentences) > 0
        }


# ============================================
# 5. ANALYSE DE FORMAT ET STRUCTURE
# ============================================

class FormatAnalyzer:
    """Analyse le format et la structure du CV"""
    
    @staticmethod
    def analyze_length(text: str) -> Dict:
        """Analyse la longueur du CV"""
        word_count = len(text.split())
        char_count = len(text)
        
        # Estimation du nombre de pages (environ 500 mots par page)
        estimated_pages = word_count / 500
        
        return {
            'word_count': word_count,
            'char_count': char_count,
            'estimated_pages': round(estimated_pages, 1),
            'is_too_long': word_count > 1000,  # Plus de 2 pages
            'is_too_short': word_count < 200,
            'optimal': 300 <= word_count <= 800
        }
    
    @staticmethod
    def check_formatting_issues(text: str) -> Dict:
        """Vérifie les problèmes de formatage"""
        issues = []
        
        # Vérifier les CAPS excessives
        caps_ratio = sum(1 for c in text if c.isupper()) / len(text) if text else 0
        if caps_ratio > 0.3:
            issues.append("Too much text in uppercase")
        
        # Vérifier les espaces multiples
        if re.search(r'\s{3,}', text):
            issues.append("Multiple spaces detected")
        
        # Vérifier l'absence de structure
        if '\n' not in text[:200]:  # Pas de retour à la ligne dans les 200 premiers caractères
            issues.append("Lack of structure/paragraphs")
        
        # Vérifier les dates
        date_patterns = [
            r'\d{4}\s*-\s*\d{4}',
            r'\d{4}\s*-\s*(?:present|current)',
            r'(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4}'
        ]
        has_dates = any(re.search(pattern, text, re.IGNORECASE) for pattern in date_patterns)
        if not has_dates:
            issues.append("Missing or poorly formatted experience dates")
        
        return {
            'issues': issues,
            'has_issues': len(issues) > 0,
            'caps_ratio': round(caps_ratio, 3)
        }
    
    @staticmethod
    def extract_experience_duration(text: str) -> Dict:
        """Extrait et calcule la durée totale d'expérience"""
        date_ranges = re.findall(r'(\d{4})\s*-\s*(?:(\d{4})|(?:present|current))', text, re.IGNORECASE)
        
        total_years = 0
        experiences = []
        
        for start, end in date_ranges:
            end_year = int(end) if end else datetime.now().year
            duration = end_year - int(start)
            total_years += duration
            experiences.append({
                'start': start,
                'end': end if end else 'Present',
                'duration_years': duration
            })
        
        return {
            'total_experience_years': total_years,
            'number_of_positions': len(experiences),
            'experiences': experiences
        }


# ============================================
# 6. SYSTÈME DE SCORING GLOBAL
# ============================================

class ResumeScorer:
    """Calcule un score global du CV"""
    
    @staticmethod
    def calculate_score(analysis_results: Dict) -> Dict:
        """
        Calcule un score sur 100 basé sur tous les critères
        """
        score = 0
        breakdown = {}
        
        # 1. Contact Information (20 points)
        contacts = analysis_results.get('contacts', {})
        contact_score = 0
        if contacts.get('emails'):
            contact_score += 5
        if contacts.get('phones'):
            contact_score += 5
        if contacts.get('linkedin'):
            contact_score += 3
        if contacts.get('github'):
            contact_score += 2
        if contacts.get('location'):
            contact_score+=5
        breakdown['contact_info'] = contact_score
        score += contact_score
        
        # 2. Sections présentes (20 points)
        sections = analysis_results.get('sections', {})
        section_score = sum(3 for present in sections.values() if present)
        section_score = min(section_score, 20)
        breakdown['sections'] = section_score
        score += section_score
        
        # 3. Qualité des verbes (15 points)
        verbs = analysis_results.get('verb_analysis', {})
        verb_score = 0
        # Pénalité pour verbes passifs et faibles
        verb_score -= min(verbs.get('passive_count', 0) * 2, 10)
        verb_score -= min(verbs.get('weak_count', 0), 5)
        # Bonus pour verbes d'action forts
        verb_score += min(verbs.get('strong_count', 0) * 2, 15)
        verb_score = max(0, verb_score)
        breakdown['verb_quality'] = verb_score
        score += verb_score
        
        # 4. Réalisations quantifiables (15 points)
        metrics = analysis_results.get('metrics', {})
        if metrics.get('has_metrics'):
            metrics_score = min(metrics.get('metrics_count', 0) * 3, 15)
        else:
            metrics_score = 0
        breakdown['quantifiable_achievements'] = metrics_score
        score += metrics_score
        
        # 5. Format et structure (15 points)
        format_analysis = analysis_results.get('format', {})
        format_score = 15
        if format_analysis.get('is_too_long') or format_analysis.get('is_too_short'):
            format_score -= 5
        if format_analysis.get('formatting_issues', {}).get('has_issues'):
            format_score -= 3
        breakdown['format'] = max(0, format_score)
        score += breakdown['format']
        
        # 6. Bullet points (10 points)
        bullets = analysis_results.get('bullets', {})
        bullet_score = 0
        if bullets.get('has_bullets'):
            bullet_score += 5
        if bullets.get('optimal_length'):
            bullet_score += 5
        breakdown['bullet_points'] = bullet_score
        score += bullet_score
        
        # 7. Absence de mots de remplissage (10 points)
        fillers = analysis_results.get('fillers', {})
        filler_score = 10 - min(fillers.get('filler_count', 0), 10)
        breakdown['language_quality'] = filler_score
        score += filler_score
        
        # Quality level in English
        final_score = min(100, max(0, score))

        if final_score >= 80:
            level = "Excellent"
        elif final_score >= 60:
            level = "Good"
        elif final_score >= 40:
            level = "Fair"
        else:
            level = "Needs Improvement"
        
        return {
            'total_score': final_score,
            'level': level,
            'breakdown': breakdown
        }


# ============================================
# 7. GÉNÉRATEUR DE RECOMMANDATIONS
# ============================================

class RecommendationEngine:
    """Génère des recommandations détaillées pour améliorer le CV"""
    
    @staticmethod
    def generate_recommendations(analysis_results: Dict) -> List[Dict]:
        """Génère une liste priorisée de recommandations"""
        recommendations = []
        
        # Contacts manquants
        contacts = analysis_results.get('contacts', {})
        if not contacts.get('emails'):
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Contact',
                'issue': 'Missing email',
                'recommendation': 'Add a professional email address at the top of your CV'
            })
        if not contacts.get('phones'):
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Contact',
                'issue': 'Missing phone number',
                'recommendation': 'Add a phone number to facilitate contact'
            })
        if not contacts.get('location'):
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Contact',
                'issue': 'Missing location',
                'recommendation': 'Indicate your city and country to help recruiters locate your profile'
            })
        
        if not contacts.get('linkedin'):
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Contact',
                'issue': 'Missing LinkedIn profile',
                'recommendation': 'Add your LinkedIn profile to increase your visibility'
            })
        
        # Sections manquantes
        sections = analysis_results.get('sections', {})
        critical_sections = ['experience', 'education', 'skills']
        for section in critical_sections:
            if not sections.get(section):
                recommendations.append({
                    'priority': 'HIGH',
                    'category': 'Structure',
                    'issue': f'Missing {section} section',
                    'recommendation': f'Add a clear section for {section}'
                })
        non_critical_sections = ['projects', 'certifications', 'summary', 'associative', 'languages']
        for section in non_critical_sections:
            if not sections.get(section):
                recommendations.append({
                    'priority': 'MEDIUM',
                    'category': 'Structure',
                    'issue': f'Missing {section} section',
                    'recommendation': f'Consider adding a section for {section} if relevant'
                })
        
        # Verb issues
        verbs = analysis_results.get('verb_analysis', {})
        if verbs.get('passive_count', 0) > 3:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Content',
                'issue': f'{verbs["passive_count"]} passive verbs detected',
                'recommendation': 'Replace passive verbs with action verbs (e.g., "Managed" instead of "Was responsible for")',
                'examples': verbs.get('passive_verbs', [])[:3]
            })
        
        if verbs.get('strong_count', 0) < 5:
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Content',
                'issue': 'Few strong action verbs',
                'recommendation': 'Use more impactful action verbs: achieved, implemented, led, optimized, etc.'
            })
        
        # Missing metrics
        metrics = analysis_results.get('metrics', {})
        if not metrics.get('has_metrics') or metrics.get('metrics_count', 0) < 3:
            recommendations.append({
                'priority': 'HIGH',
                'category': 'Impact',
                'issue': 'Lack of quantifiable results',
                'recommendation': 'Add concrete numbers: percentages, amounts, number of projects/people, deadlines, etc.'
            })
        
        # Format issues
        format_analysis = analysis_results.get('format', {})
        if format_analysis.get('is_too_long'):
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Format',
                'issue': 'CV too long',
                'recommendation': f'Reduce length to 1-2 pages ({format_analysis["word_count"]} words currently)'
            })
        
        # Filler words
        fillers = analysis_results.get('fillers', {})
        if fillers.get('has_too_many'):
            recommendations.append({
                'priority': 'LOW',
                'category': 'Style',
                'issue': 'Excessive filler words',
                'recommendation': f'Remove unnecessary words: {", ".join(fillers.get("filler_words", [])[:5])}',
            })
        
        # Bullet points
        bullets = analysis_results.get('bullets', {})
        if not bullets.get('has_bullets'):
            recommendations.append({
                'priority': 'MEDIUM',
                'category': 'Format',
                'issue': 'Missing bullet points',
                'recommendation': 'Use bullet points to clearly list your achievements'
            })
        
        # Trier par priorité
        priority_order = {'HIGH': 0, 'MEDIUM': 1, 'LOW': 2}
        recommendations.sort(key=lambda x: priority_order[x['priority']])
        
        return recommendations


# ============================================
# 8. CLASSE PRINCIPALE - ORCHESTRATION
# ============================================

class ResumeAnalyzer:
    """Classe principale qui orchestre toute l'analyse"""
    
    def __init__(self):
        self.pdf_extractor = PDFExtractor()
        self.contact_extractor = ContactExtractor()
        self.section_detector = SectionDetector()
        self.quality_analyzer = QualityAnalyzer()
        self.format_analyzer = FormatAnalyzer()
        self.scorer = ResumeScorer()
        self.recommendation_engine = RecommendationEngine()
    
    def analyze_resume(self, pdf_path: str) -> Dict:
        """
        Analyse complète d'un CV en PDF
        
        Args:
            pdf_path: Chemin vers le fichier PDF du CV
            
        Returns:
            Dictionnaire contenant toute l'analyse
        """
        print("🔍 Extracting text from PDF...")
        raw_text = self.pdf_extractor.extract_text_from_pdf(pdf_path)
        clean_text = self.pdf_extractor.clean_text(raw_text)
        #print(clean_text)
        
        print("📧 Extracting contact information...")
        contacts = self.contact_extractor.extract_all_contacts(clean_text,pdf_path)
        
        print("📑 Detecting sections...")
        sections = self.section_detector.detect_sections(raw_text)
        
        # Extraire le contenu de la section expérience pour analyse détaillée
        experience_text = self.section_detector.extract_section_content(raw_text, 'experience')
        for sec in sections:
            if sections[sec]:
                print(self.section_detector.extract_section_content(raw_text, sec))
        print("✍️ Analyzing content quality...")
        verb_analysis = self.quality_analyzer.analyze_verbs(experience_text if experience_text else clean_text)
        metrics = self.quality_analyzer.detect_quantifiable_achievements(clean_text)
        bullets = self.quality_analyzer.analyze_bullet_points(raw_text)
        fillers = self.quality_analyzer.check_filler_words(clean_text)
        sentence_structure = self.quality_analyzer.analyze_sentence_structure(clean_text)
        
        print("📏 Analyzing format...")
        length_analysis = self.format_analyzer.analyze_length(clean_text)
        formatting_issues = self.format_analyzer.check_formatting_issues(clean_text)
        experience_duration = self.format_analyzer.extract_experience_duration(clean_text)
        
        # Compiler tous les résultats
        analysis_results = {
            'raw_text': raw_text,
            'clean_text': clean_text,
            'contacts': contacts,
            'sections': sections,
            'verb_analysis': verb_analysis,
            'metrics': metrics,
            'bullets': bullets,
            'fillers': fillers,
            'sentence_structure': sentence_structure,
            'format': {**length_analysis, 'formatting_issues': formatting_issues},
            'experience_duration': experience_duration
        }
        
        print("🎯 Calculating score...")
        score = self.scorer.calculate_score(analysis_results)
        
        print("💡 Generating recommendations...")
        recommendations = self.recommendation_engine.generate_recommendations(analysis_results)
        
        return {
            'analysis': analysis_results,
            'score': score,
            'recommendations': recommendations,
            'summary': {
                'total_score': score['total_score'],
                'level': score['level'],
                'critical_issues': len([r for r in recommendations if r['priority'] == 'HIGH']),
                'total_recommendations': len(recommendations),
                'strong_verbs': verb_analysis['strong_verbs'],
                'metrics': metrics['metrics_examples'],
                'bullets': bullets['bullet_count'],
                'filler_words': fillers['filler_words'],
                'weak_verbs': verb_analysis['weak_verbs'],
                'passive_verbs': verb_analysis['passive_verbs']
            }
        }
    
    def generate_report(self, analysis_result: Dict) -> str:
        """Generates text report of the analysis"""
        report = []
        report.append("=" * 60)
        report.append("📊 CV ANALYSIS REPORT")
        report.append("=" * 60)
        report.append("")
        
        # Score global
        summary = analysis_result['summary']
        score_info = analysis_result['score']
        report.append(f"🎯 OVERALL SCORE: {summary['total_score']}/100 - {summary['level']}")
        report.append("")
        
        # Score breakdown
        report.append("📈 Score Breakdown:")
        for category, points in score_info['breakdown'].items():
            report.append(f"  • {category.replace('_', ' ').title()}: {points} points")
        report.append("")
        
        # Key statistics
        analysis = analysis_result['analysis']
        report.append("📊 STATISTICS:")
        report.append(f"  • Word count: {analysis['format']['word_count']}")
        report.append(f"  • Estimated pages: {analysis['format']['estimated_pages']}")
        report.append(f"  • Years of experience: {analysis['experience_duration']['total_experience_years']}")
        report.append(f"  • Strong action verbs: {analysis['verb_analysis']['strong_count']}")
        report.append(f"  • Quantifiable metrics: {analysis['metrics']['metrics_count']}")
        report.append("")
        
        # Sections présentes
        report.append("📑 DETECTED SECTIONS:")
        for section, present in analysis['sections'].items():
            status = "✅" if present else "❌"
            report.append(f"  {status} {section.title()}")
        report.append("")
        
        # Informations de contact
        report.append("📧 CONTACT INFORMATION:")
        contacts = analysis['contacts']
        report.append(f"  • Emails: {len(contacts['emails'])} found")
        report.append(f"  • Phones: {len(contacts['phones'])} found")
        report.append(f"  • Location: {contacts['location'] if contacts['location'] else 'Not found'}")
        report.append(f"  • LinkedIn: {'Yes' if contacts['linkedin'] else 'No'}")
        report.append(f"  • GitHub: {'Yes' if contacts['github'] else 'No'}")
        report.append("")
        
        # Recommendations
        report.append("💡 PRIORITY RECOMMENDATIONS:")
        recommendations = analysis_result['recommendations']
        
        high_priority = [r for r in recommendations if r['priority'] == 'HIGH']
        if high_priority:
            report.append("\n  🔴 HIGH PRIORITY:")
            for i, rec in enumerate(high_priority, 1):
                report.append(f"    {i}. [{rec['category']}] {rec['issue']}")
                report.append(f"       → {rec['recommendation']}")
        
        medium_priority = [r for r in recommendations if r['priority'] == 'MEDIUM']
        if medium_priority:
            report.append("\n  🟡 MEDIUM PRIORITY:")
            for i, rec in enumerate(medium_priority, 1):
                report.append(f"    {i}. [{rec['category']}] {rec['issue']}")
                report.append(f"       → {rec['recommendation']}")
        
        report.append("")
        report.append("=" * 60)
        
        return "\n".join(report)
    
    def export_to_json(self, analysis_result: Dict, output_path: str):
        """Exporte l'analyse en JSON"""
        # Nettoyer les résultats pour JSON (enlever le texte brut trop long)
        export_data = {
            'summary': analysis_result['summary'],
            'score': analysis_result['score'],
            'recommendations': analysis_result['recommendations'],
            'contacts': analysis_result['analysis']['contacts'],
            'sections': analysis_result['analysis']['sections'],
            'statistics': {
                'verb_analysis': analysis_result['analysis']['verb_analysis'],
                'metrics': analysis_result['analysis']['metrics'],
                'format': {
                    'word_count': analysis_result['analysis']['format']['word_count'],
                    'estimated_pages': analysis_result['analysis']['format']['estimated_pages']
                }
            }
        }
        
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)
        # Debug: display analysis_result in console
        # print(analysis_result)
        print(f"✅ Analysis exported to {output_path}")

# ============================================
# 9. USAGE EXAMPLE
# ============================================

def main():
    """
    Example usage of the Resume Analysis System
    """
    import sys
    
    # Check arguments
    if len(sys.argv) < 2:
        print("Usage: python resume_analyzer.py <path_to_cv.pdf>")
        print("\nExample:")
        print("  python resume_analyzer.py my_resume.pdf")
        return
    
    pdf_path = sys.argv[1]
    
    try:
        # Create the analyzer
        analyzer = ResumeAnalyzer()
        
        print(f"\n🚀 Analyzing resume: {pdf_path}")
        print("-" * 60)
        
        # Analyze the resume
        result = analyzer.analyze_resume(pdf_path)
        
        # Display the report
        print("\n" + analyzer.generate_report(result))
        
        # Export as JSON
        json_output = pdf_path.replace('.pdf', '_analysis.json')
        analyzer.export_to_json(result, json_output)
        
        print(f"\n✨ Analysis completed successfully!")
        print(f"📄 JSON report saved to: {json_output}")
        
    except Exception as e:
        print(f"\n❌ Error during analysis: {str(e)}")
        import traceback
        traceback.print_exc()


# ============================================
# 10. PROGRAMMATIC USAGE (for integration)
# ============================================

class ResumeAnalyzerAPI:
    """
    Simplified API for integration into your application
    """
    
    def __init__(self):
        self.analyzer = ResumeAnalyzer()
    
    def analyze(self, pdf_path: str) -> Dict:
        """
        Analyzes a resume and returns structured results
        
        Returns:
            Dict with: score, recommendations, issues_to_fix
        """
        result = self.analyzer.analyze_resume(pdf_path)
        
        return {
            'success': True,
            'score': result['summary']['total_score'],
            'level': result['summary']['level'],
            'recommendations': result['recommendations'],
            'sections_missing': [
                section for section, present 
                in result['analysis']['sections'].items() 
                if not present
            ],
            'contact_info': result['analysis']['contacts'],
            'issues_to_fix': {
                'high_priority': [
                    r for r in result['recommendations'] 
                    if r['priority'] == 'HIGH'
                ],
                'medium_priority': [
                    r for r in result['recommendations'] 
                    if r['priority'] == 'MEDIUM'
                ]
            },
            'full_analysis': result
        }
    
    def get_text_to_improve(self, pdf_path: str) -> List[Dict]:
        """
        Extracts specific sections to improve for LLM suggestions
        
        Returns:
            List of sections with identified issues
        """
        result = self.analyzer.analyze_resume(pdf_path)
        analysis = result['analysis']
        
        sections_to_improve = []
        
        # Experience section with weak verbs
        experience_text = self.analyzer.section_detector.extract_section_content(
            analysis['clean_text'], 
            'experience'
        )
        
        if experience_text and analysis['verb_analysis']['weak_count'] > 0:
            sections_to_improve.append({
                'section': 'experience',
                'text': experience_text,
                'issues': [
                    "Replace passive and weak verbs with strong action verbs",
                    "Add quantifiable achievements"
                ],
                'weak_verbs': analysis['verb_analysis']['weak_verbs'],
                'passive_verbs': analysis['verb_analysis']['passive_verbs']
            })
        
        return sections_to_improve



if __name__ == "__main__":
    main()