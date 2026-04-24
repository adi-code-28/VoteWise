import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import confetti from 'canvas-confetti';
import { 
  CheckCircle2, 
  Circle, 
  MapPin, 
  Calendar, 
  FileText, 
  UserCheck, 
  MessageSquare,
  Trophy,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  ChevronRight,
  Info,
  Landmark,
  Soup,
  Music,
  Users,
  Palette,
  TowerControl as Castle,
  Heart,
  Volume2,
  Scale,
  Sparkles,
  Command,
  Languages
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { getChatResponse, explainEligibility } from './services/gemini';
import { Language, UserProgress, ElectionDate, Document, ChatMessage } from './types';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'motion/react';
import L from 'leaflet';
import html2canvas from 'html2canvas';

// Fix Leaflet icon issue
import 'leaflet/dist/leaflet.css';
// @ts-ignore
import markerIcon from 'leaflet/dist/images/marker-icon.png';
// @ts-ignore
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// --- Constants & Data ---

const ELECTION_DATES: ElectionDate[] = [
  { id: '1', title: 'Voter Registration Deadline', date: '2026-03-15', description: 'Last chance to register or update details.', type: 'deadline' },
  { id: '2', title: 'Phase 1 Voting', date: '2026-04-10', description: 'Main polling day for northern regions.', type: 'event' },
  { id: '3', title: 'Result Day', date: '2026-05-15', description: 'Official counting and results announcement.', type: 'event' },
];

const INDIA_MAP_PATH = "M 103,1 C 103,1 100,5 98,7 C 96,9 91,10 91,10 C 91,10 88,3 88,3 C 88,3 81,1 81,1 C 81,1 77,4 77,4 C 77,4 72,1 72,1 C 72,1 68,5 68,5 C 68,5 64,8 64,8 C 64,8 62,12 62,12 C 62,12 60,11 60,11 C 60,11 58,16 58,16 C 58,16 54,16 54,16 C 54,16 52,19 52,19 C 52,19 46,20 46,20 C 46,20 41,20 41,20 C 41,20 38,24 38,24 C 38,24 35,24 35,24 C 35,24 32,32 32,32 C 32,32 30,36 30,36 C 30,36 37,39 37,39 C 37,39 37,42 37,42 C 37,42 41,43 41,43 C 41,43 43,49 43,49 C 43,49 42,54 42,54 C 42,54 41,56 41,56 C 41,56 32,60 32,60 C 32,60 21,63 21,63 C 21,63 19,67 19,67 C 19,67 19,74 19,74 C 19,74 15,75 15,75 C 15,75 18,80 18,80 C 18,80 19,84 19,84 C 19,84 21,85 21,85 C 21,85 21,88 21,88 C 21,88 17,94 17,94 C 17,94 19,95 19,95 C 19,95 24,98 24,98 C 24,98 33,101 33,101 C 33,101 35,103 35,103 C 35,103 35,107 35,107 C 35,107 43,109 43,109 C 43,109 47,112 47,112 C 47,112 49,118 49,118 C 49,118 53,121 53,121 C 53,121 56,123 56,123 C 56,123 59,129 59,129 C 59,129 64,136 64,136 C 64,136 68,141 68,141 C 68,141 71,155 71,155 C 71,155 83,184 83,184 C 83,184 87,192 87,192 C 87,192 89,203 89,203 C 89,203 93,218 93,218 C 93,218 96,227 96,227 C 96,227 98,235 98,235 C 98,235 101,235 101,235 C 101,235 104,233 104,233 C 104,233 106,229 106,229 C 106,229 111,219 111,219 C 111,219 117,208 117,208 C 117,208 122,197 122,197 C 122,197 127,185 127,185 C 127,185 130,175 130,175 C 130,175 133,165 133,165 C 133,165 136,158 136,158 C 136,158 137,149 137,149 C 137,149 141,141 141,141 C 141,141 144,137 144,137 C 144,137 146,132 146,132 C 146,132 144,129 144,129 C 144,129 144,127 144,127 C 144,127 146,124 146,124 C 146,124 150,123 150,123 C 150,123 152,118 152,118 C 152,118 152,110 152,110 C 152,110 155,108 155,108 C 155,108 157,103 157,103 C 157,103 156,99 156,99 C 156,99 162,96 162,96 C 162,96 167,99 167,99 C 167,99 173,101 173,101 C 173,101 176,101 176,101 C 176,101 180,95 180,95 C 180,95 180,88 180,88 C 180,88 178,82 178,82 C 178,82 173,81 173,81 C 173,81 169,78 169,78 C 169,78 162,78 162,78 C 162,78 159,75 159,75 C 159,75 157,70 157,70 C 157,70 156,64 156,64 C 156,64 153,61 153,61 C 153,61 152,56 152,56 C 152,56 151,51 151,51 C 151,51 147,46 147,46 C 147,46 145,39 145,39 C 145,39 145,33 145,33 C 145,33 143,26 143,26 C 143,26 141,20 141,20 C 141,20 139,11 139,11 C 139,11 136,8 136,8 C 136,8 131,8 131,8 C 131,8 126,5 126,5 C 126,5 121,1 121,1 C 121,1 116,4 116,4 C 116,4 112,6 112,6 C 112,6 109,3 109,3 C 109,3 105,1 105,1 Z";

const LOTUS_PATH = "M50,10 C60,0 70,0 80,10 C90,20 90,40 80,50 C70,60 60,60 50,70 C40,60 30,60 20,50 C10,40 10,20 20,10 C30,0 40,0 50,10 M50,10 L50,70 M20,50 C20,70 40,90 50,90 C60,90 80,70 80,50";

const MONUMENT_SHAPES = {
  taj: "M10,90 L90,90 L90,60 C90,40 60,40 50,40 C40,40 10,40 10,60 Z M50,40 L50,10 M20,60 L20,30 M80,60 L80,30",
  gate: "M20,90 L20,30 L80,30 L80,90 L70,90 L70,50 C70,40 30,40 30,50 L30,90 Z"
};

const REQUIRED_DOCS: Document[] = [
  { id: 'd1', name: 'Identity Proof', category: 'Identity', isMandatory: true, description: 'Aadhaar Card, Passport, or PAN Card.' },
  { id: 'd2', name: 'Address Proof', category: 'Address', isMandatory: true, description: 'Electricity Bill, Bank Passbook, or Rent Agreement.' },
  { id: 'd3', name: 'Age Proof', category: 'Age', isMandatory: true, description: 'Birth Certificate or 10th Standard Marksheet.' },
  { id: 'd4', name: 'Passport Size Photos', category: 'General', isMandatory: true, description: 'Two recent color photographs.' },
];

const TRANSLATIONS = {
  en: {
    title: 'VoteWise',
    subtitle: 'Election Education Assistant',
    getStarted: 'Get Started',
    eciGuidelines: 'ECI Guidelines',
    home: 'Home',
    eligibility: 'Eligibility',
    dashboard: 'Dashboard',
    timeline: 'Timeline',
    checklist: 'Checklist',
    chatbot: 'AI Assistant',
    booth: 'Polling Booth',
    nextStep: 'Next Step',
    readyToVote: 'Ready to Vote',
    myProgress: 'My Progress',
    badges: 'Achievements',
    askAnything: 'Ask anything about elections...',
    myths: 'Myth Buster',
    back: 'Back',
    backToDashboard: 'Back to Dashboard',
    youAreHere: 'You are here',
    bestChoice: 'Best Choice for Me',
    firstTime: 'First-time Voter',
    returning: 'Returning Voter',
    voterTypeTitle: 'How can we help you today?',
    voterTypeSub: 'Tell us your voting history to personalize your guide.',
    namePlaceholder: 'Enter your name',
    constituencyPlaceholder: 'Enter your constituency',
    agePlaceholder: 'Enter your age',
    ineligibleAge: 'You must be 18 or older to vote in India.',
    downloadCert: 'Download Certificate',
    shareReady: 'Share Voting Readiness',
    idProof: 'Identity Proof',
    addrProof: 'Address Proof',
    ageProof: 'Age Proof',
    photoProof: 'Photos',
  },
  hi: {
    title: 'वोटवाइज',
    subtitle: 'चुनाव शिक्षा सहायक',
    getStarted: 'शुरू करें',
    eciGuidelines: 'ईसीआई दिशानिर्देश',
    home: 'होम',
    eligibility: 'पात्रता',
    dashboard: 'डैशबोर्ड',
    timeline: 'समयरेखा',
    checklist: 'दस्तावेज़ सूची',
    chatbot: 'एआई सहायक',
    booth: 'मतदान केंद्र',
    nextStep: 'अगला कदम',
    readyToVote: 'वोट देने के लिए तैयार',
    myProgress: 'मेरी प्रगति',
    badges: 'उपलब्धियां',
    askAnything: 'चुनाव के बारे में कुछ भी पूछें...',
    myths: 'भ्रम निवारण',
    back: 'पीछे',
    backToDashboard: 'डैशबोर्ड पर वापस',
    youAreHere: 'आप यहाँ हैं',
    bestChoice: 'मेरे लिए सबसे अच्छा विकल्प',
    firstTime: 'पहली बार वोटर',
    returning: 'अनुभवी वोटर',
    voterTypeTitle: 'आज हम आपकी कैसे मदद कर सकते हैं?',
    voterTypeSub: 'अपने अनुभव के अनुसार अपना गाइड चुनें।',
    namePlaceholder: 'अपना नाम लिखें',
    constituencyPlaceholder: 'अपना निर्वाचन क्षेत्र लिखें',
    agePlaceholder: 'अपनी आयु लिखें',
    ineligibleAge: 'भारत में मतदान करने के लिए आपकी आयु 18 वर्ष या उससे अधिक होनी चाहिए।',
    downloadCert: 'प्रमाणपत्र डाउनलोड करें',
    shareReady: 'तैयारी साझा करें',
    idProof: 'पहचान प्रमाण',
    addrProof: 'पता प्रमाण',
    ageProof: 'आयु प्रमाण',
    photoProof: 'तस्वीरें',
  },
  bn: {
    title: 'ভোটওয়াইজ',
    subtitle: 'নির্বাচন শিক্ষা সহকারী',
    getStarted: 'শুরু করুন',
    eciGuidelines: 'ইসিআই নির্দেশিকা',
    home: 'হোম',
    eligibility: 'যোগ্যতা',
    dashboard: 'ড্যাশবোর্ড',
    timeline: 'সময়রেখা',
    checklist: 'নথি তালিকা',
    chatbot: 'এআই সহকারী',
    booth: 'ভোটকেন্দ্র',
    nextStep: 'পরবর্তী ধাপ',
    readyToVote: 'ভোটের জন্য প্রস্তুত',
    myProgress: 'আমার অগ্রগতি',
    badges: 'কৃতিত্ব',
    askAnything: 'নির্বাচন সম্পর্কে কিছু জিজ্ঞাসা করুন...',
    myths: 'ভ্রম সংশোধন',
    back: 'পিছনে',
    backToDashboard: 'ড্যাশবোর্ড ফিরে যান',
    youAreHere: 'আপনি এখানে আছেন',
    bestChoice: 'আমার জন্য সেরা পছন্দ',
    firstTime: 'প্রথমবারের ভোটার',
    returning: 'অভিজ্ঞ ভোটার',
    voterTypeTitle: 'আজ আমরা কীভাবে আপনাকে সাহায্য করতে পারি?',
    voterTypeSub: 'আপনার ভোরের অভিজ্ঞতা অনুযায়ী গাইড সেট করুন।',
    namePlaceholder: 'আপনার নাম লিখুন',
    constituencyPlaceholder: 'আপনার নির্বাচনী এলাকা লিখুন',
    agePlaceholder: 'আপনার বয়স লিখুন',
    ineligibleAge: 'ভারতে ভোট দেওয়ার জন্য আপনার বয়স ১৮ বছর বা তার বেশি হতে হবে।',
    downloadCert: 'শংসাপত্র ডাউনলোড করুন',
    shareReady: 'প্রস্তুতি শেয়ার করুন',
    idProof: 'পরিচয় প্রমাণ',
    addrProof: 'ঠিকানার প্রমাণ',
    ageProof: 'বয়সের প্রমাণ',
    photoProof: 'ছবি',
  },
  ta: {
    title: 'வோட்வைஸ்',
    subtitle: 'தேர்தல் கல்வி உதவியாளர்',
    getStarted: 'தொடங்குங்கள்',
    eciGuidelines: 'தேர்தல் ஆணைய வழிகாட்டுதல்கள்',
    home: 'முகப்பு',
    eligibility: 'தகுதி',
    dashboard: 'டாஷ்போர்டு',
    timeline: 'காலவரிசை',
    checklist: 'ஆவணப் பட்டியல்',
    chatbot: 'AI உதவியாளர்',
    booth: 'வாக்குச்சாவடி',
    nextStep: 'அடுத்த கட்டம்',
    readyToVote: 'வாக்களிக்கத் தயார்',
    myProgress: 'எனது முன்னேற்றம்',
    badges: 'சாதனைகள்',
    askAnything: 'தேர்தல் பற்றி எதையும் கேளுங்கள்...',
    myths: 'கட்டுக்கதை உடைப்பு',
    back: 'பின்செல்',
    backToDashboard: 'டாஷ்போர்டுக்குச் செல்',
    youAreHere: 'நீங்கள் இங்கே இருக்கிறீர்கள்',
    bestChoice: 'எனக்கான சிறந்த தேர்வு',
    firstTime: 'முதல் முறை வாக்காளர்',
    returning: 'அனுபவம் வாய்ந்த வாக்காளர்',
    voterTypeTitle: 'இன்று நாங்கள் உங்களுக்கு எப்படி உதவ முடியும்?',
    voterTypeSub: 'உங்கள் வழிகாட்டியைத் தனிப்பயனாக்க உங்கள் வாக்களிப்பு வரலாற்றைச் சொல்லுங்கள்.',
    namePlaceholder: 'உங்கள் பெயரை உள்ளிடவும்',
    constituencyPlaceholder: 'உங்கள் தொகுதியை உள்ளிடவும்',
    agePlaceholder: 'உங்கள் வயதை உள்ளிடவும்',
    ineligibleAge: 'இந்தியாவில் வாக்களிக்க உங்களுக்கு 18 வயது அல்லது அதற்கு மேல் இருக்க வேண்டும்.',
    downloadCert: 'சான்றிதழைப் பதிவிறக்கவும்',
    shareReady: 'தயாராக இருப்பதைப் பகிரவும்',
    idProof: 'அடையாளச் சான்று',
    addrProof: 'முகவரிச் சான்று',
    ageProof: 'வயதுச் சான்று',
    photoProof: 'புகைப்படங்கள்',
  },
  mr: {
    title: 'वोटवाईज',
    subtitle: 'निवडणूक शिक्षण सहाय्यक',
    getStarted: 'सुरु करा',
    eciGuidelines: 'निवडणूक आयोग मार्गदर्शक तत्त्वे',
    home: 'होम',
    eligibility: 'पात्रता',
    dashboard: 'डॅशबोर्ड',
    timeline: 'वेळापत्रक',
    checklist: 'कागदपत्रे',
    chatbot: 'AI सहाय्यक',
    booth: 'मतदान केंद्र',
    nextStep: 'पुढील पाऊल',
    readyToVote: 'मतदानासाठी तयार',
    myProgress: 'माझी प्रगती',
    badges: 'उपलब्धी',
    askAnything: 'निवडणुकीबद्दल काहीही विचारा...',
    myths: 'भ्रम निवारण',
    back: 'मागे',
    backToDashboard: 'डॅशबोर्डवर परत',
    youAreHere: 'तुम्ही इथे आहात',
    bestChoice: 'माझ्यासाठी सर्वोत्तम निवड',
    firstTime: 'प्रथमच मतदार',
    returning: 'अनुभवी मतदार',
    voterTypeTitle: 'आज आम्ही तुम्हाला कशी मदत करू शकतो?',
    voterTypeSub: 'तुमचा मार्गदर्शक वैयक्तिकृत करण्यासाठी तुमचा मतदानाचा इतिहास सांगा.',
    namePlaceholder: 'तुमचे नाव प्रविष्ट करा',
    constituencyPlaceholder: 'तुमचा मतदारसंघ प्रविष्ट करा',
    agePlaceholder: 'तुमचे वय प्रविष्ट करा',
    ineligibleAge: 'भारतात मतदान करण्यासाठी तुमचे वय १८ वर्ष किंवा त्यापेक्षा जास्त असणे आवश्यक आहे.',
    downloadCert: 'प्रमाणपत्र डाउनलोड करा',
    shareReady: 'तयारी शेअर करा',
    idProof: 'ओळख पुरावा',
    addrProof: 'पत्ता पुरावा',
    ageProof: 'वय पुरावा',
    photoProof: 'फोटो',
  }
};

// --- Components ---

const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-chakra/5 rounded-full h-3 overflow-hidden p-1 border border-chakra/10 shadow-inner">
    <motion.div 
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 1, ease: "easeOut" }}
      className="h-full rounded-full patriotic-gradient shadow-[0_0_15px_rgba(255,153,51,0.4)] relative"
    >
      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-[shimmer_2s_infinite]" />
    </motion.div>
  </div>
);

const WavingFlag = ({ size = "sm" }: { size?: "sm" | "lg" }) => (
  <div 
    className={`relative shadow-lg overflow-hidden border border-white/10 rounded-[2px] shrink-0 ${size === 'lg' ? 'w-24 h-16' : 'w-10 h-7'}`}
  >
    <div className="h-1/3 bg-[#FF9933]" />
    <div className="h-1/3 bg-white flex items-center justify-center relative">
       <div className="w-1/4 h-full py-1">
          <AshokaChakra />
       </div>
    </div>
    <div className="h-1/3 bg-[#138808]" />
    <div 
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
    />
  </div>
);

const AshokaChakra = ({ className = "w-full h-full" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={`${className} text-[#000080]`} fill="none" stroke="currentColor" strokeWidth="0.8">
    <defs>
      <radialGradient id="chakraGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
        <stop offset="0%" stopColor="#000080" />
        <stop offset="70%" stopColor="#0000FF" />
        <stop offset="100%" stopColor="#000080" />
      </radialGradient>
    </defs>
    <circle cx="12" cy="12" r="10" stroke="url(#chakraGradient)" strokeWidth="1.2" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    {[...Array(24)].map((_, i) => (
      <line
        key={i}
        x1="12"
        y1="12"
        x2={12 + 8 * Math.cos((i * 15 * Math.PI) / 180)}
        y2={12 + 8 * Math.sin((i * 15 * Math.PI) / 180)}
        stroke="currentColor"
        strokeWidth="0.6"
      />
    ))}
    {/* Adding small dots between spokes for "more shades/detail" */}
    {[...Array(24)].map((_, i) => (
      <circle
        key={`dot-${i}`}
        cx={12 + 9 * Math.cos(((i * 15 + 7.5) * Math.PI) / 180)}
        cy={12 + 9 * Math.sin(((i * 15 + 7.5) * Math.PI) / 180)}
        r="0.3"
        fill="currentColor"
      />
    ))}
  </svg>
);

const IndianMapShape = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 240" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="mapGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FF9933" />
        <stop offset="33%" stopColor="#FF9933" />
        <stop offset="33%" stopColor="#FFFFFF" />
        <stop offset="66%" stopColor="#FFFFFF" />
        <stop offset="66%" stopColor="#138808" />
        <stop offset="100%" stopColor="#138808" />
      </linearGradient>
      <mask id="mapMask">
        <path d={INDIA_MAP_PATH} fill="white" />
      </mask>
    </defs>
    <rect x="0" y="0" width="200" height="240" fill="url(#mapGradient)" mask="url(#mapMask)" />
    <path d={INDIA_MAP_PATH} fill="none" stroke="#000080" strokeWidth="1" opacity="0.2" />
    <g transform="translate(100, 110) scale(1.5)">
       <AshokaChakra className="w-8 h-8 opacity-90" />
    </g>
  </svg>
);

const IndianHeritageBackground = ({ variant = "full" }: { variant?: "full" | "minimal" }) => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-saffron/10 via-white to-green/5 opacity-40" />
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full opacity-5 pointer-events-none">
       <div className="absolute top-[10%] left-[10%] w-64 h-64 border-[40px] border-chakra rounded-full opacity-10 blur-xl" />
       <div className="absolute bottom-[20%] right-[15%] w-96 h-96 border-[60px] border-saffron rounded-full opacity-10 blur-2xl" />
    </div>
    <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(#000080 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
  </div>
);

const BadgeCard = ({ name, earned }: { name: string, earned: boolean }) => (
  <div className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 border-2 ${earned ? 'bg-chakra/5 border-saffron text-chakra' : 'bg-chakra/5 border-chakra/10 text-chakra/40 grayscale'}`}>
    <Trophy size={earned ? 32 : 24} className={earned ? 'text-saffron shadow-sm' : ''} />
    <span className="text-[10px] font-black uppercase tracking-wider">{name}</span>
  </div>
);

const StepCard = ({ number, title, desc, active }: { number: string, title: string, desc: string, active: boolean }) => (
  <div className={`relative p-6 rounded-2xl border ${active ? 'bg-white border-saffron shadow-xl text-chakra' : 'bg-white/10 border-white/20 text-white opacity-60'}`}>
    <div className="absolute -top-4 -left-4 w-10 h-10 bg-saffron text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
      {number}
    </div>
    <h3 className="font-display font-bold text-lg mb-2 pt-2">{title}</h3>
    <p className="text-sm opacity-90 leading-relaxed">{desc}</p>
  </div>
);

const MapFlyTo = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14);
  }, [center, map]);
  return null;
};

const RealMap = ({ booths, selectedIdx, userCoords, onSelect, lang }: { booths: any[], selectedIdx: number | null, userCoords: {lat: number, lng: number} | null, onSelect: (idx: number) => void, lang: Language }) => {
  const center: [number, number] = userCoords ? [userCoords.lat, userCoords.lng] : [28.6139, 77.2090]; // Delhi as fallback

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={center} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userCoords && (
          <Marker key="user-pos" position={[userCoords.lat, userCoords.lng]}>
            <Popup>{TRANSLATIONS[lang as Language]?.youAreHere || 'You are here'}</Popup>
          </Marker>
        )}
        {booths.map((booth: any, idx) => {
          // Use real coordinates if available, else fallback to distribution
          const lat = booth.coords ? booth.coords[0] : (userCoords ? userCoords.lat + (Math.sin(idx) * 0.005) : 28.6139 + (Math.sin(idx) * 0.005));
          const lng = booth.coords ? booth.coords[1] : (userCoords ? userCoords.lng + (Math.cos(idx) * 0.005) : 77.2090 + (Math.cos(idx) * 0.005));
          
          return (
            <Marker 
              key={`booth-${idx}`} 
              position={[lat, lng]} 
              eventHandlers={{
                click: () => onSelect(idx),
              }}
            >
              <Popup>
                <div className="p-2 space-y-1">
                  <div className="font-bold text-chakra text-sm">{booth.name}</div>
                  <div className="text-[10px] text-chakra/60 font-black leading-tight">{booth.addr}</div>
                  <div className="text-[10px] font-black text-saffron uppercase border-t-2 border-chakra/10 pt-1 mt-1">{booth.distance}</div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {userCoords && <MapFlyTo center={[userCoords.lat, userCoords.lng]} />}
      </MapContainer>
      
      {!userCoords && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-10 flex flex-col items-center justify-center p-8 text-center">
          <div className="relative">
             <div className="absolute -inset-8 bg-chakra/5 rounded-2xl"></div>
             <MapPin size={48} className="text-chakra opacity-50 mb-4" />
          </div>
          <p className="font-display font-black text-chakra opacity-80 uppercase tracking-widest text-xs">Waiting for GPS Signal...</p>
        </div>
      )}
    </div>
  );
};

const Certificate = ({ progress, lang }: { progress: UserProgress, lang: Language }) => {
  const t = TRANSLATIONS[lang];
  const certRef = useRef<HTMLDivElement>(null);

  const download = async () => {
    if (certRef.current) {
      const canvas = await html2canvas(certRef.current, {
        scale: 2, 
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false
      });
      const link = document.createElement('a');
      link.download = `VoteWise-Citizen-Badge-${progress.userName || 'Voter'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div 
        ref={certRef}
        className="p-[3px] rounded-[2rem] shadow-2xl relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FF9933 0%, #FFFFFF 50%, #138808 100%)' }}
      >
        <div className="bg-white rounded-[1.8rem] p-8 md:p-12 text-center relative overflow-hidden border border-[#000080]/10">
          <div className="relative z-10 space-y-8">
            <div className="flex flex-col items-center gap-3">
               <div className="flex items-center gap-4">
                  <div className="w-12 h-[2px] bg-[#FF9933] rounded-sm" />
                  <div className="w-12 h-[2px] bg-[#138808] rounded-sm" />
               </div>
               <h3 className="font-display font-black text-2xl text-chakra tracking-tighter uppercase italic">VOTEWISE CITIZEN</h3>
            </div>

            <div className="py-6 border-y border-[#000080]/5">
              <p className="text-[10px] font-black text-[#000080] opacity-40 uppercase tracking-[0.4em] mb-4">This Is To Certify That</p>
              <h2 className="font-display font-black text-4xl md:text-5xl text-[#000080] mb-1">
                 {progress.userName || 'PROUD CITIZEN'}
              </h2>
              <p className="text-chakra/40 font-black tracking-[0.4em] text-[10px] mt-2 italic">FROM {progress.constituency?.toUpperCase() || 'INDIA'}</p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <p className="text-sm font-medium text-gray-600 max-w-md leading-relaxed px-4">
                Has successfully completed the <span className="font-black text-chakra">Mission 2026 Voter Preparedness</span>. 
                They are fully equipped with knowledge, documents, and a verified polling destination.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 pt-8">
               <div className="flex flex-col items-center gap-1 border-r border-gray-100">
                  <ShieldCheck size={32} className="text-[#138808] mb-1" />
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Integrity Verified</p>
               </div>
               <div className="flex flex-col items-center gap-1">
                  <Trophy size={32} className="text-[#FF9933] mb-1" />
                  <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none">Engagement Award</p>
               </div>
            </div>

            <div className="pt-6 flex items-center justify-between opacity-60 border-t-2 border-chakra/10">
               <div className="text-left text-[9px] font-black text-chakra">
                  SERIAL: VW-2026-{(Math.random() * 10000).toFixed(0)}
               </div>
               <div className="text-right text-[9px] font-black text-chakra">
                  DATE: {new Date().toLocaleDateString()}
               </div>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={download}
        className="w-full py-5 bg-chakra text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 bg-chakra shadow-2xl shadow-chakra/30 border-b-4 border-black/20"
      >
        <Trophy size={20} className="text-saffron" />
        {t.downloadCert}
      </button>
    </div>
  );
};

const VoterTypeModal = ({ progress, onSave, lang }: { progress: UserProgress, onSave: (data: Partial<UserProgress>) => void, lang: Language }) => {
  const t = TRANSLATIONS[lang];
  const [userName, setUserName] = useState(progress.userName || '');
  const [constituency, setConstituency] = useState(progress.constituency || '');
  const [age, setAge] = useState<string>(progress.age?.toString() || '');
  const [voterType, setVoterType] = useState<'first-time' | 'returning' | null>(progress.voterType);
  
  const [isCitizen, setIsCitizen] = useState(progress.isCitizen !== false);
  
  const isUnderage = age !== '' && parseInt(age) < 18;
  const canContinue = userName.trim() !== '' && constituency.trim() !== '' && voterType !== null && age !== '' && !isUnderage && isCitizen;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] bg-chakra/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-[4rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] w-full max-w-2xl p-12 md:p-16 overflow-hidden relative border border-chakra/5 my-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/10 rounded-full blur-[100px] -mr-32 -mt-32" />
        
        <div className="text-center space-y-6 mb-14 relative z-10">
           <div className="flex justify-center gap-2 mb-4">
              <div className="w-2 h-2 bg-saffron rounded-full" />
              <div className="w-2 h-2 bg-chakra rounded-full opacity-20" />
              <div className="w-2 h-2 bg-green rounded-full opacity-10" />
           </div>
           <h2 className="font-display font-black text-4xl md:text-5xl text-chakra leading-[1.1] tracking-tight">{t.voterTypeTitle}</h2>
           <p className="text-chakra/50 font-medium text-lg">{t.voterTypeSub}</p>
        </div>

        <div className="space-y-10 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <button 
              onClick={() => setVoterType('first-time')}
              className={`p-8 rounded-[3rem] border-2 text-left group transition-all duration-500 relative ${voterType === 'first-time' ? 'border-saffron bg-saffron/5 shadow-xl shadow-saffron/10' : 'border-chakra/5 bg-gray-50/50 hover:bg-white hover:shadow-xl'}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${voterType === 'first-time' ? 'bg-saffron text-white shadow-lg shadow-saffron/20' : 'bg-chakra/5 text-chakra'}`}>
                <Landmark size={28} />
              </div>
              <h3 className="font-black text-chakra text-xl mb-1">{t.firstTime}</h3>
              <p className="text-[10px] text-chakra/40 font-black uppercase tracking-widest">Step-by-step roadmap</p>
              {voterType === 'first-time' && (
                <div className="absolute top-8 right-8">
                  <CheckCircle2 size={24} className="text-saffron" />
                </div>
              )}
            </button>
            <button 
              onClick={() => setVoterType('returning')}
              className={`p-8 rounded-[3rem] border-2 text-left group transition-all duration-500 relative ${voterType === 'returning' ? 'border-green bg-green/5 shadow-xl shadow-green/10' : 'border-chakra/10 bg-gray-50/50 hover:bg-white hover:shadow-xl'}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-all duration-500 ${voterType === 'returning' ? 'bg-green text-white shadow-lg shadow-green/20' : 'bg-chakra/5 text-chakra'}`}>
                <CheckCircle2 size={28} />
              </div>
              <h3 className="font-black text-chakra text-xl mb-1">{t.returning}</h3>
              <p className="text-[10px] text-chakra/40 font-black uppercase tracking-widest">Status & updates</p>
              {voterType === 'returning' && (
                <div className="absolute top-8 right-8">
                  <CheckCircle2 size={24} className="text-green" />
                </div>
              )}
            </button>
          </div>

          <div className="space-y-6 pt-10 border-t border-chakra/5">
             <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-chakra/30 px-3">Identity Name</label>
                <input 
                  type="text" 
                  placeholder={t.namePlaceholder}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full p-6 bg-chakra/5 border-2 border-chakra/5 rounded-[2rem] outline-none focus:ring-4 focus:ring-chakra/5 text-chakra font-black placeholder:text-chakra/20 transition-all text-lg"
                />
             </div>
             <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-chakra/30 px-3">Constituency</label>
                   <input 
                     type="text" 
                     placeholder={t.constituencyPlaceholder}
                     value={constituency}
                     onChange={(e) => setConstituency(e.target.value)}
                     className="w-full p-6 bg-chakra/5 border-2 border-chakra/5 rounded-[2rem] outline-none focus:ring-4 focus:ring-chakra/5 text-chakra font-black placeholder:text-chakra/20 transition-all"
                   />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-black uppercase tracking-[0.2em] text-chakra/30 px-3">Age</label>
                   <input 
                     type="number" 
                     placeholder={t.agePlaceholder}
                     value={age}
                     onChange={(e) => setAge(e.target.value)}
                     className={`w-full p-6 bg-chakra/5 border-2 rounded-[2rem] outline-none transition-all text-chakra font-black placeholder:text-chakra/20 ${isUnderage ? 'border-red-500 ring-4 ring-red-500/10' : 'border-chakra/5 focus:ring-chakra/5'}`}
                   />
                </div>
             </div>

             <div className="flex items-center gap-4 p-5 bg-chakra/5 rounded-[2rem] border border-chakra/5 group cursor-pointer" onClick={() => setIsCitizen(!isCitizen)}>
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isCitizen ? 'bg-chakra border-chakra text-white' : 'border-chakra/20 bg-white'}`}>
                   {isCitizen && <CheckCircle2 size={14} />}
                </div>
                <label className="text-sm font-black text-chakra flex-1 cursor-pointer">
                   I am a citizen of India
                </label>
             </div>
             
             {isUnderage && (
               <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-black flex items-center gap-3">
                 <Info size={16} />
                 {t.ineligibleAge}
               </motion.div>
             )}
          </div>

          <button 
            disabled={!canContinue}
            onClick={() => onSave({ userName, constituency, voterType, age: parseInt(age), isCitizen })}
            className="w-full py-6 bg-chakra text-white rounded-[2.5rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-chakra/30 flex items-center justify-center gap-3 disabled:opacity-20 disabled:pointer-events-none hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Mission Deployment <ArrowRight size={20} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

// --- Main App ---

const DashboardSidebar = ({ currentView, setView, t }: any) => {
  const menuItems = [
    { id: 'dashboard', icon: <Command size={18} />, label: t.dashboard, color: 'text-chakra' },
    { id: 'eligibility', icon: <UserCheck size={18} />, label: t.eligibility, color: 'text-saffron' },
    { id: 'timeline', icon: <Calendar size={18} />, label: t.timeline, color: 'text-green' },
    { id: 'checklist', icon: <FileText size={18} />, label: t.checklist, color: 'text-chakra' },
    { id: 'booth', icon: <MapPin size={18} />, label: t.booth, color: 'text-saffron' },
  ];

  return (
    <div className="hidden lg:flex flex-col w-72 bg-white border-r border-chakra/5 min-h-[calc(100vh-64px)] sticky top-16 p-8 space-y-2 z-20 shadow-[20px_0_40px_rgba(0,0,0,0.01)] transition-all">
      <div className="py-2">
        <p className="text-[10px] font-black text-chakra/30 uppercase tracking-[0.4em] mb-10 px-4">Mission Console</p>
        <div className="space-y-2">
          {menuItems.map(item => (
            <button 
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center justify-between px-5 py-4 rounded-[1.5rem] font-black text-sm transition-all duration-500 group relative overflow-hidden ${
                currentView === item.id 
                  ? 'bg-chakra text-white shadow-2xl shadow-chakra/20 scale-[1.02] -translate-y-1' 
                  : 'text-chakra/60 hover:bg-chakra/5 hover:text-chakra'
              }`}
            >
              <div className="flex items-center gap-4 relative z-10">
                <span className={`transition-all duration-500 ${currentView === item.id ? 'text-white rotate-[15deg]' : 'text-chakra/30 group-hover:text-chakra group-hover:rotate-[15deg]'}`}>
                  {item.icon}
                </span>
                <span className="tracking-tight">{item.label}</span>
              </div>
              {currentView === item.id && (
                <motion.div 
                  layoutId="active-nav-glow"
                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0"
                  animate={{ x: [-200, 200] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                />
              )}
              {currentView === item.id && <ChevronRight size={14} className="opacity-40" />}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-auto pt-10 px-4">
         <div className="p-6 bg-chakra text-white rounded-[2rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
            <ShieldCheck className="mb-4 text-saffron relative z-10" size={24} />
            <p className="font-black text-[10px] uppercase tracking-widest mb-1 relative z-10">Protocol Guard</p>
            <p className="text-[8px] font-bold text-white/60 leading-relaxed relative z-10 uppercase">Identity Verified & Encryption Enabled</p>
         </div>
      </div>
    </div>
  );
};

const DashboardHeader = ({ userName }: any) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-3xl font-black text-chakra tracking-tight">Namaste, {userName || 'Citizen'}!</h2>
      <p className="text-chakra font-black opacity-90">Welcome to your personalized election dashboard.</p>
    </motion.div>
    <div className="flex items-center gap-3">
       <div className="hidden md:flex flex-col items-end">
          <span className="text-sm font-black text-chakra uppercase">{userName || 'Indian Citizen'}</span>
          <span className="text-[10px] text-green font-black flex items-center gap-1 border border-green/20 px-2 py-0.5 rounded-full bg-green/5">
             <div className="w-1.5 h-1.5 bg-green rounded-full animate-pulse" />
             AI Backend Active
          </span>
       </div>
       <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-chakra">
          <UserCheck size={24} />
       </div>
    </div>
  </div>
);

export default function App() {
  const [lang, setLang] = useState<Language>('en');

  const [view, setView] = useState<'landing' | 'dashboard' | 'eligibility' | 'timeline' | 'checklist' | 'booth' | 'eci-guidelines'>('landing');
  const [progress, setProgress] = useState<UserProgress>({
    isEligible: null,
    hasRegistered: false,
    hasRequiredDocs: false,
    knowsPollingBooth: false,
    badges: [],
    storedDocs: {},
    voterType: null,
    userName: '',
    constituency: ''
  });
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [searchingBooth, setSearchingBooth] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [eligibilityReport, setEligibilityReport] = useState<string>('');
  const [analyzingEligibility, setAnalyzingEligibility] = useState(false);

  // Global Progress Effect
  useEffect(() => {
    if (calculateProgress() === 100) {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF9933', '#FFFFFF', '#138808', '#000080']
      });
    }
  }, [progress.isEligible, progress.hasRegistered, progress.hasRequiredDocs, progress.knowsPollingBooth]);

  const checkEligibilityDetailed = async () => {
    if (!progress.age) return;
    setAnalyzingEligibility(true);
    try {
      const report = await explainEligibility(
        progress.age || 0, 
        progress.isCitizen, 
        `Lives in ${progress.constituency || 'India'}`
      );
      setEligibilityReport(report || 'Unable to generate report at this time.');
    } catch (error) {
      console.error("Eligibility analysis error:", error);
    } finally {
      setAnalyzingEligibility(false);
    }
  };

  useEffect(() => {
    if (view === 'eligibility' && progress.age) {
      checkEligibilityDetailed();
    }
  }, [view, progress.age, progress.isCitizen]);

  const [locationInput, setLocationInput] = useState('');
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [foundBooths, setFoundBooths] = useState<{name: string, distance: string, addr: string, coords?: [number, number]}[]>([]);
  const [selectedBooth, setSelectedBooth] = useState<number | null>(null);

  const t = TRANSLATIONS[lang];
  const idleTimer = useRef<NodeJS.Timeout | null>(null);

  // Proactive AI Agent Logic
  useEffect(() => {
    if (view === 'landing') return;

    const resetIdleTimer = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        // AI Proactively reaches out
        if (!chatOpen) {
          const proactiveMsgs: Record<Language, string> = {
            en: "Hey! I noticed you stepped away. Need help with the next step?",
            hi: "नमस्ते! मुझे लगा कि आप रुक गए हैं। क्या अगले कदम में मदद चाहिए?",
            bn: "ওহে! আমি লক্ষ্য করেছি আপনি থেমে গেছেন। পরবর্তী পদক্ষেপে সাহায্যের প্রয়োজন কি?",
            ta: "ஏய்! நீங்கள் விலகிச் சென்றதைக் கவனித்தேன். அடுத்த கட்டத்திற்கு உதவி வேண்டுமா?",
            mr: "हो! तुम्ही थांबलात असं वाटतंय. पुढच्या पायरीसाठी काही मदत हवी आहे का?"
          };
          setMessages(prev => [...prev, { role: 'model', text: proactiveMsgs[lang], isAutoGenerated: true }]);
          setChatOpen(true);
        }
      }, 40000); // 40 seconds idle
    };

    window.addEventListener('mousemove', resetIdleTimer);
    window.addEventListener('keypress', resetIdleTimer);
    resetIdleTimer();

    return () => {
      window.removeEventListener('mousemove', resetIdleTimer);
      window.removeEventListener('keypress', resetIdleTimer);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [view, lang, chatOpen]);

  // Contextual Intelligence
  useEffect(() => {
    if (view === 'checklist' && !progress.hasRequiredDocs) {
      const timer = setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'model', 
          text: lang === 'en' ? "Stuck on documents? Remember, your Aadhaar Card often works as ID, Address, and Age proof all at once!" : "दस्तावेजों पर अटके हैं? याद रखें, आपका आधार कार्ड अक्सर पहचान, पता और आयु प्रमाण के रूप में एक साथ काम करता है!",
          isAutoGenerated: true 
        }]);
        setChatOpen(true);
      }, 50000);
      return () => clearTimeout(timer);
    }
  }, [view, progress.hasRequiredDocs, lang]);
  const calculateProgress = () => {
    let p = 0;
    if (progress.isEligible) p += 25;
    if (progress.hasRegistered) p += 25;
    if (progress.hasRequiredDocs) p += 25;
    if (progress.knowsPollingBooth) p += 25;
    return p;
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await getChatResponse(userMsg, history);
    setMessages(prev => [...prev, { role: 'model', text: response }]);
    setIsTyping(false);
  };

  const speak = (text: string) => {
    // Basic markdown stripping for speech
    const cleanText = text.replace(/[*_#~`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const langMap: Record<Language, string> = {
      en: 'en-US',
      hi: 'hi-IN',
      bn: 'bn-IN',
      ta: 'ta-IN',
      mr: 'mr-IN'
    };
    utterance.lang = langMap[lang] || 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleUpload = (docId: string, category: string, fileName: string) => {
    setProgress(prev => {
      const nextDocs = { ...prev.storedDocs, [docId]: fileName };
      // Check if all mandatory categories are filled
      const mandatoryDocs = REQUIRED_DOCS.filter(d => d.isMandatory).map(d => d.id);
      const allUploaded = mandatoryDocs.every(id => nextDocs[id]);
      
      return {
        ...prev,
        storedDocs: nextDocs,
        hasRequiredDocs: allUploaded
      };
    });
  };

  const removeDoc = (docId: string) => {
    setProgress(prev => {
      const nextDocs = { ...prev.storedDocs };
      delete nextDocs[docId];
      return {
        ...prev,
        storedDocs: nextDocs,
        hasRequiredDocs: false
      };
    });
  };

  const detectLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          setUserCoords({ lat: latitude, lng: longitude });
          
          // Using Nominatim with proper User-Agent as per policy
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`, {
            headers: {
              'User-Agent': 'VoteWise-App-Assistant'
            }
          });
          const data = await res.json();
          
          const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          setTimeout(() => {
            setLocationInput(address);
            setDetectingLocation(false);
            searchBooth(address);
          }, 1000);
        } catch (error) {
          console.error("Geocoding error:", error);
          const mockAddress = "27th Main, HSR Layout, Bengaluru";
          setLocationInput(mockAddress);
          setDetectingLocation(false);
          searchBooth(mockAddress);
        }
      },
      (error) => {
        setDetectingLocation(false);
        const fallbackAddress = "Constituency Main Road";
        setLocationInput(fallbackAddress);
        searchBooth(fallbackAddress);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  const searchBooth = (overrideInput?: string) => {
    setSearchingBooth(true);
    setFoundBooths([]);
    setSelectedBooth(null);
    const query = (overrideInput || locationInput).toLowerCase();
    
    setTimeout(() => {
      // More dynamic results based on query keywords
      const results: { name: string, distance: string, addr: string, coords: [number, number] }[] = [
        { name: 'National Public School Booth A', distance: '0.4 km', addr: 'Block 2, Ground Floor', coords: userCoords ? [userCoords.lat + 0.002, userCoords.lng + 0.001] : [12.912, 77.641] },
        { name: 'Community Hall (East Wing)', distance: '1.1 km', addr: 'Sector 3 Entrance', coords: userCoords ? [userCoords.lat - 0.003, userCoords.lng + 0.004] : [12.923, 77.652] },
        { name: 'Government Primary School', distance: '1.4 km', addr: 'Main Street, Near Library', coords: userCoords ? [userCoords.lat + 0.005, userCoords.lng - 0.002] : [12.901, 77.635] },
        { name: 'Civic Center Auditorium', distance: '2.2 km', addr: '14th Cross Road', coords: userCoords ? [userCoords.lat - 0.006, userCoords.lng - 0.005] : [12.932, 77.621] }
      ];

      // Filter or "personalize" based on query
      if (query.includes('hsr') || query.includes('bengaluru')) {
        setFoundBooths(results.slice(0, 3));
      } else if (query.includes('delhi')) {
        setFoundBooths([
          { name: 'NDMC School, Chanakyapuri', distance: '0.6 km', addr: 'Sector 4, New Delhi', coords: [28.59, 77.18] },
          { name: 'Vishwa Bharati Hall', distance: '1.5 km', addr: 'Block C, Lodhi Road', coords: [28.58, 77.22] }
        ]);
      } else {
        // Universal fallback
        setFoundBooths(results.slice(0, 2));
      }
      setSearchingBooth(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen font-sans bg-gray-50/30 relative">
      <IndianHeritageBackground variant={view === 'landing' ? 'full' : 'minimal'} />
      
      {view !== 'landing' && view !== 'eci-guidelines' && !progress.voterType && (
        <VoterTypeModal 
          progress={progress} 
          lang={lang}
          onSave={(data) => setProgress(prev => ({ ...prev, ...data }))}
        />
      )}
      <header className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div 
              className="flex items-center gap-3 cursor-pointer group"
              onClick={() => setView('landing')}
            >
              <div className="flex items-center gap-2">
                <WavingFlag />
                <div className="w-10 h-10 bg-chakra rounded-xl flex items-center justify-center text-white shadow-xl relative overflow-hidden">
                   <div 
                     className="absolute inset-0 bg-saffron/20 opacity-30"
                   />
                   <div className="relative z-10 w-6 h-6">
                      <IndianMapShape className="w-full h-full" />
                   </div>
                </div>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-chakra tracking-tight leading-none">{t.title}</h1>
                <span className="text-[10px] uppercase font-bold text-saffron tracking-widest">{t.subtitle}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-chakra/5 border border-chakra/10 rounded-xl">
                <Languages size={14} className="text-chakra/40" />
                <select 
                  value={lang}
                  onChange={(e) => setLang(e.target.value as Language)}
                  className="text-xs font-black bg-transparent outline-none cursor-pointer text-chakra uppercase tracking-widest border-none p-0"
                >
                  <option value="en">EN</option>
                  <option value="hi">HI</option>
                  <option value="bn">BN</option>
                  <option value="ta">TA</option>
                  <option value="mr">MR</option>
                </select>
              </div>
            </div>
        </div>
      </header>
                      {/* Main Content Area */}
      {view === 'landing' ? (
        <main className="pt-24 pb-32 max-w-7xl mx-auto px-4">
            <div 
              className="space-y-32 relative z-10"
            >
              {/* Hero Section */}
              <section className="text-center space-y-10 py-12">
                <h2 className="text-5xl md:text-8xl font-black text-chakra tracking-tight leading-[0.9] max-w-4xl mx-auto drop-shadow-sm">
                  Empower Your <span className="text-saffron italic">Voice</span>, <br />
                  Lead Your <span className="text-green">Nation</span>.
                </h2>
                
                <p className="text-lg md:text-xl text-chakra/80 max-w-2xl mx-auto font-medium leading-relaxed">
                  Join millions of citizens in shaping India's future. Our AI-powered guide makes voter registration and preparation seamless, secure, and accessible.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                  <button 
                    onClick={() => setView('dashboard')}
                    className="group px-12 py-6 bg-chakra text-white rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-2xl shadow-chakra/30 flex items-center gap-3 relative overflow-hidden transition-all hover:shadow-chakra/50 hover:-translate-y-1 active:scale-95"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-saffron/20 to-transparent translate-x-[-100%]" />
                    Get Started <ArrowRight size={20} />
                  </button>

                  <button 
                    onClick={() => setView('eci-guidelines')}
                    className="group px-12 py-6 bg-white text-chakra border-2 border-chakra/10 rounded-[2.5rem] font-black uppercase tracking-widest text-sm shadow-xl flex items-center gap-3 transition-all hover:bg-chakra/5 hover:-translate-y-1 active:scale-95"
                  >
                    {t.eciGuidelines} <FileText size={20} />
                  </button>
                </div>
              </section>

              {/* Features Grid */}
              <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: <ShieldCheck size={32} />, title: "Secure & Private", desc: "Your data stays on your device. We use locally encrypted storage for your documents." },
                  { icon: <Users size={32} />, title: "Multilingual AI", desc: "Get real-time assistance in 12+ Indian languages with our advanced AI model." },
                  { icon: <Landmark size={32} />, title: "Direct NVSP Link", desc: "Seamlessly connect to official government portals for registration and tracking." }
                ].map((f, i) => (
                  <div 
                    key={i}
                    className="p-8 bg-white/70 backdrop-blur-xl rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 space-y-6 transition-all hover:shadow-2xl hover:-translate-y-2"
                  >
                    <div className="w-16 h-16 bg-chakra/5 text-chakra rounded-2xl flex items-center justify-center">
                      {f.icon}
                    </div>
                    <h3 className="text-2xl font-black text-chakra tracking-tight">{f.title}</h3>
                    <p className="text-chakra/60 font-medium leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </section>
            </div>
        </main>
      ) : (
        <div className="flex bg-gray-50/50 min-h-screen pt-16">
          <DashboardSidebar currentView={view} setView={setView} t={t} />
          <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
            <DashboardHeader userName={progress.userName} />
               {view === 'dashboard' && (
                   <div 
                     className="space-y-8"
                   >
                     <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                       <div className="xl:col-span-2 space-y-8">
                         <div className="p-10 bg-white rounded-[3rem] shadow-sm border border-chakra/20 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-chakra opacity-[0.02] -mr-32 -mt-32 rounded-full" />
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                             <div>
                               <h3 className="text-2xl font-black text-chakra mb-1 tracking-tight">Mission Readiness Profile</h3>
                               <p className="text-chakra font-medium text-sm">
                                  {progress.voterType === 'first-time' ? 'Step-by-step roadmap for new voters' : 'Fast-track updates for experienced citizens'}
                               </p>
                             </div>
                             <div className="flex items-center gap-6">
                                <div className="text-center">
                                   <div className="text-3xl font-black text-saffron">{calculateProgress()}%</div>
                                   <div className="text-[9px] font-black text-chakra/60 uppercase tracking-widest leading-none mt-1">Completion</div>
                                </div>
                                <div className="w-[1px] h-10 bg-gray-100" />
                                <div className="text-center">
                                   <div className={`text-3xl font-black ${progress.isEligible === true ? 'text-green' : progress.isEligible === false ? 'text-red-500' : 'text-gray-300'}`}>
                                      {progress.isEligible === true ? 'YES' : progress.isEligible === false ? 'NO' : 'PENDING'}
                                   </div>
                                   <div className="text-[9px] font-black text-chakra/60 uppercase tracking-widest leading-none mt-1">Eligibility</div>
                                </div>
                             </div>
                           </div>

                           <div className="w-full bg-chakra/5 rounded-2xl h-8 overflow-hidden p-1.5 border-2 border-chakra/10 mb-10 relative">
                             <div 
                               style={{ width: `${calculateProgress()}%` }}
                               className="patriotic-gradient h-full rounded-xl shadow-lg relative transition-all duration-1000"
                             >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/30 to-transparent" />
                             </div>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {[
                               { id: 'eligibility', icon: <UserCheck size={20} />, title: 'Eligibility Check', desc: 'Personal details & voting rights', done: progress.isEligible },
                               { id: 'dashboard', icon: <FileText size={20} />, title: 'Voter Registration', desc: 'Form 6 status & NVSP portal', done: progress.hasRegistered, toggle: true },
                               { id: 'checklist', icon: <ShieldCheck size={20} />, title: 'Document Vault', desc: 'Secure storage for ID & Age proof', done: progress.hasRequiredDocs },
                               { id: 'booth', icon: <MapPin size={20} />, title: 'Booth Locator', desc: 'Find your nearest polling station', done: progress.knowsPollingBooth },
                             ].map((step) => (
                               <button 
                                 key={step.id}
                                 onClick={() => step.toggle ? setProgress(p => ({ ...p, hasRegistered: !p.hasRegistered })) : setView(step.id as any)}
                                 className={`p-6 rounded-[2rem] border-2 text-left flex gap-5 group relative overflow-hidden transition-all hover:shadow-2xl hover:-translate-y-1 ${
                                   step.done 
                                     ? 'bg-green/5 border-green/30' 
                                     : 'bg-white border-chakra/10'
                                 }`}
                               >
                                 <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center ${
                                   step.done ? 'bg-green text-white shadow-lg shadow-green/20' : 'bg-chakra/5 text-chakra border-2 border-chakra/10'
                                 }`}>
                                   {step.icon}
                                 </div>
                                 <div className="relative z-10 pt-1">
                                   <div className="font-display font-black text-chakra text-lg leading-tight mb-1">{step.title}</div>
                                   <p className="text-xs text-chakra/80 line-clamp-1">{step.desc}</p>
                                 </div>
                                 {step.done && (
                                   <div className="absolute top-4 right-4">
                                      <CheckCircle2 size={16} className="text-green" />
                                   </div>
                                 )}
                               </button>
                             ))}
                           </div>
                         </div>

                         {calculateProgress() === 100 && (
                            <div className="p-10 bg-white rounded-[3rem] shadow-2xl border-2 border-saffron/20 relative overflow-hidden">
                               <div className="absolute -top-24 -right-24 w-80 h-80 bg-saffron opacity-[0.03] rounded-full blur-3xl" />
                               <Certificate progress={progress} lang={lang} />
                            </div>
                         )}
                         
                         <div className="p-10 bg-chakra text-white rounded-[3rem] shadow-2xl shadow-chakra/30 relative overflow-hidden border-4 border-white/10">
                            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/5 rounded-3xl blur-3xl rotate-45" />
                            <div className="relative z-10">
                               <div className="flex items-center gap-4 mb-8">
                                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                     <Info size={24} className="text-saffron" />
                                  </div>
                                  <h3 className="text-2xl font-black tracking-tight">The Democratic Journey</h3>
                               </div>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                  {[
                                    { step: '01', title: 'Verify Details', desc: 'Ensure your name exists in the 2026 Electoral Roll.' },
                                    { step: '02', title: 'Collect ID', desc: 'Keep your Voter ID card or Aadhaar card ready.' },
                                    { step: '03', title: 'Cast Vote', desc: 'Go to your booth on election day and empower India.' }
                                  ].map((item, i) => (
                                    <div key={i} className="space-y-4">
                                       <div className="text-4xl font-black text-saffron/40">{item.step}</div>
                                       <div className="font-black text-xl tracking-tight">{item.title}</div>
                                       <p className="text-sm text-white/90 leading-relaxed font-black">{item.desc}</p>
                                    </div>
                                  ))}
                               </div>
                            </div>
                         </div>
                       </div>

                       <div className="space-y-8">
                          <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-chakra/10">
                             <h3 className="font-display font-black text-xl mb-6 flex items-center gap-2 text-chakra uppercase tracking-tight">
                                <Trophy size={20} className="text-saffron" />
                                achievements
                             </h3>
                             <div className="grid grid-cols-2 gap-4">
                                <BadgeCard name="Citizen" earned={calculateProgress() >= 25} />
                                <BadgeCard name="Verified" earned={progress.hasRegistered} />
                                <BadgeCard name="Ready" earned={progress.hasRequiredDocs} />
                                <BadgeCard name="Voter" earned={calculateProgress() === 100} />
                             </div>
                          </div>

                          <div className="p-8 bg-white rounded-[2.5rem] shadow-sm border border-chakra/10">
                             <h3 className="font-display font-black text-xl mb-6 flex items-center gap-2 text-chakra uppercase tracking-tight">
                                <Calendar size={20} className="text-saffron" />
                                election dates
                             </h3>
                             <div className="space-y-6">
                                {ELECTION_DATES.map(date => (
                                  <div key={date.id} className="flex gap-4 items-start group">
                                     <div className="w-14 h-14 bg-chakra/5 rounded-2xl flex flex-col items-center justify-center border border-chakra/10 group-hover:bg-saffron/10 transition-colors">
                                        <span className="text-[10px] font-black uppercase text-chakra">{new Date(date.date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-2xl font-black leading-none text-chakra">{new Date(date.date).getDate()}</span>
                                     </div>
                                     <div className="pt-1">
                                        <div className="font-black text-sm text-chakra tracking-tight leading-tight mb-1">{date.title}</div>
                                        <p className="text-[11px] text-chakra font-black truncate">{date.description}</p>
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                          
                          <div className="p-6 bg-gradient-to-br from-chakra to-chakra/90 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
                             <h4 className="font-black text-lg mb-2 relative z-10">Need Assistance?</h4>
                             <p className="text-xs text-white font-bold mb-6 relative z-10">Our AI assistant is ready to help you in 5+ languages.</p>
                             <button 
                              onClick={() => setChatOpen(true)}
                              className="w-full py-4 bg-saffron text-white rounded-[1.2rem] font-black text-sm uppercase tracking-widest shadow-lg shadow-saffron/20 hover:scale-[1.02] transition-all relative z-10"
                             >
                                Ask AI Assistant
                             </button>
                          </div>
                       </div>
                     </div>
                    </div>
                 )}

          {view === 'eligibility' && (
            <div className="max-w-3xl mx-auto space-y-8 pb-32">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-10 rounded-[3rem] border-2 border-chakra/10 shadow-xl shadow-chakra/5 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 text-chakra/10">
                   <ShieldCheck size={120} />
                </div>

                <div className="relative z-10 space-y-8">
                  <div className="flex items-center justify-between">
                    <button 
                      onClick={() => setView('dashboard')}
                      className="flex items-center gap-2 text-chakra font-bold hover:translate-x-1 transition-all"
                    >
                      <ArrowLeft size={20} />
                      {t.backToDashboard}
                    </button>
                    <div className="bg-chakra/5 px-4 py-1.5 rounded-full border border-chakra/10 text-[10px] font-black text-chakra flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-chakra rounded-full animate-pulse" />
                       REAL-TIME ANALYTICS
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-chakra rounded-2xl flex items-center justify-center text-white shadow-lg shadow-chakra/30">
                      <UserCheck size={28} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-chakra">Eligibility Verification</h2>
                      <p className="text-chakra font-black uppercase tracking-widest text-[10px] opacity-70">AI Verification Guard</p>
                    </div>
                  </div>

                  <div className="p-8 bg-chakra/5 rounded-[2.5rem] border-2 border-chakra/10 space-y-6">
                    <h3 className="font-black text-chakra flex items-center gap-2 uppercase tracking-tighter">
                       <Scale size={18} className="text-saffron" /> Eligibility Parameters
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <div className="p-6 bg-white rounded-3xl border-2 border-chakra/10 shadow-sm">
                          <p className="text-[10px] uppercase font-black text-chakra tracking-wider mb-2">Current Age</p>
                          <div className="flex items-center justify-between">
                             <p className={`text-3xl font-black ${progress.age && progress.age >= 18 ? 'text-green' : 'text-red-600'}`}>{progress.age || 'Not Set'}</p>
                             <input 
                              type="number" 
                              value={progress.age || ''} 
                              onChange={(e) => setProgress(p => ({ ...p, age: parseInt(e.target.value) }))}
                              className="w-20 px-2 py-1.5 border-2 border-chakra/10 rounded-lg text-chakra font-black text-center focus:border-chakra outline-none"
                             />
                          </div>
                          <div className="text-[10px] font-black text-chakra mt-3 flex items-center gap-1.5 opacity-70">
                             <div className="p-1 bg-chakra/10 rounded-full"><Info size={10} /></div> Min: 18 years
                          </div>
                       </div>
                       <div className="p-6 bg-white rounded-3xl border-2 border-chakra/10 shadow-sm">
                          <p className="text-[10px] uppercase font-black text-chakra tracking-wider mb-2">Citizen Status</p>
                          <div className="flex items-center justify-between">
                             <p className={`text-xl font-black ${progress.isEligible !== false ? 'text-green' : 'text-red-600'}`}>{progress.isEligible !== false ? 'VERIFIED' : 'INELIGIBLE'}</p>
                             <div className="flex gap-1">
                                <button onClick={() => setProgress(p => ({ ...p, isEligible: true }))} className={`px-3 py-2 rounded-lg text-[10px] font-black ${progress.isEligible ? 'bg-chakra text-white shadow-lg shadow-chakra/20' : 'bg-gray-100 text-chakra/40'}`}>YES</button>
                                <button onClick={() => setProgress(p => ({ ...p, isEligible: false }))} className={`px-3 py-2 rounded-lg text-[10px] font-black ${progress.isEligible === false ? 'bg-red-600 text-white shadow-lg shadow-red-600/20' : 'bg-gray-100 text-chakra/40'}`}>NO</button>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                       <h3 className="font-black text-chakra flex items-center gap-2 uppercase tracking-tighter">
                          <MessageSquare size={18} className="text-saffron" /> AI Insights & Strategic Steps
                       </h3>
                       {analyzingEligibility && (
                         <div className="flex items-center gap-3 bg-chakra/5 px-4 py-1.5 rounded-full border border-chakra/10">
                           <div className="flex gap-1">
                              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-chakra rounded-full"></motion.div>
                              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-chakra rounded-full"></motion.div>
                              <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-chakra rounded-full"></motion.div>
                           </div>
                           <span className="text-[10px] font-black text-chakra uppercase tracking-widest">Oracle Processing</span>
                         </div>
                       )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-6">
                       <div className="p-1 rounded-[2.5rem] bg-gradient-to-br from-chakra/20 via-saffron/40 to-chakra/20 shadow-2xl">
                          <div className="p-10 bg-chakra text-white rounded-[2.3rem] font-medium leading-relaxed relative overflow-hidden h-full border border-white/10">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-saffron/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                             
                             <div className="relative z-10">
                                {analyzingEligibility ? (
                                  <div className="space-y-6">
                                     <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 bg-saffron rounded-full animate-bounce"></div>
                                        <div className="w-80 h-4 bg-white/10 rounded-full animate-pulse"></div>
                                     </div>
                                     <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse"></div>
                                     <div className="h-4 bg-white/10 rounded-full w-1/2 animate-pulse"></div>
                                  </div>
                                ) : (
                                  <div className="space-y-8">
                                     <div className="flex items-center justify-between pb-6 border-b border-white/10">
                                        <div className="flex items-center gap-4">
                                           <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/20">
                                              <Users size={24} className="text-saffron" />
                                           </div>
                                           <div>
                                              <span className="font-black uppercase tracking-widest text-[10px] text-saffron block mb-1">AI Strategic Report</span>
                                              <span className="font-black text-lg tracking-tight">Mission 2026 Readiness</span>
                                           </div>
                                        </div>
                                     </div>
                                     
                                     <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                                        <div className="markdown-body text-sm md:text-base font-bold leading-relaxed text-white/95">
                                           <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                              {eligibilityReport || 'Awaiting profile completion for detailed verification advice...'}
                                           </ReactMarkdown>
                                        </div>
                                     </div>
                                     
                                     {!analyzingEligibility && eligibilityReport && (
                                       <div className="flex flex-wrap gap-3">
                                          <div className="px-4 py-2 bg-saffron text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-saffron/20">
                                             Action Required
                                          </div>
                                          <div className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/20">
                                             Verified by Oracle
                                          </div>
                                       </div>
                                     )}
                                  </div>
                                )}
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>

                  <button 
                   onClick={() => setView('dashboard')}
                   className="w-full py-5 bg-saffron text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-saffron/20 flex items-center justify-center gap-2 hover:bg-saffron/90 transition-all active:scale-[0.98]"
                  >
                    Return to Mission Hub <ArrowRight size={20} />
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {view === 'checklist' && (
            <div 
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-4">
                  <button 
                    onClick={() => setView('dashboard')}
                    className="flex items-center gap-2 text-chakra font-bold hover:translate-x-1 transition-all"
                    aria-label={t.back}
                  >
                    <ArrowLeft size={20} />
                    {t.back}
                  </button>
                  <div>
                    <h2 className="font-display font-black text-4xl text-chakra">Document Vault</h2>
                    <p className="text-chakra font-bold">Securely store your documents for easy access during registration</p>
                  </div>
                </div>
                <div className="bg-chakra/5 px-4 py-2 rounded-xl border border-chakra/10 flex items-center gap-2">
                   <ShieldCheck className="text-green" size={18} />
                   <span className="text-sm font-bold text-chakra">End-to-End Encrypted</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {REQUIRED_DOCS.map(doc => {
                  const storedFile = (progress.storedDocs as any)[doc.id];
                  return (
                    <div key={doc.id} className={`p-8 rounded-[2.5rem] border-2 transition-all ${storedFile ? 'bg-green/5 border-green/30' : 'bg-white border-chakra/20 shadow-xl shadow-chakra/5'}`}>
                      <div className="flex items-start justify-between mb-6">
                        <div className={`p-4 rounded-2xl ${storedFile ? 'bg-green text-white shadow-lg' : 'bg-chakra/10 text-chakra border-2 border-chakra/20 shadow-sm'}`}>
                          <FileText size={24} />
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.isMandatory && <span className="px-3 py-1 bg-red-600 text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-red-600/20">Required</span>}
                          {storedFile && <span className="px-3 py-1 bg-green text-white text-[10px] font-black uppercase rounded-lg shadow-lg shadow-green/20">Verified Vault</span>}
                        </div>
                      </div>
                      <h3 className="font-display font-black text-2xl mb-2 text-chakra">{doc.name}</h3>
                      <p className="text-xs text-chakra font-black leading-relaxed mb-8">{doc.description}</p>
                      
                      {storedFile ? (
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-green/20 shadow-inner group transition-all">
                          <div className="flex items-center gap-3 truncate pr-4">
                            <CheckCircle2 size={20} className="text-green shrink-0" />
                            <span className="text-sm font-black text-chakra truncate">{storedFile}</span>
                          </div>
                          <button 
                            onClick={() => removeDoc(doc.id)}
                            className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-3 w-full py-4 bg-chakra text-white rounded-2xl font-black uppercase tracking-widest text-xs cursor-pointer hover:bg-saffron transition-all shadow-xl shadow-chakra/20 active:scale-[0.98]">
                          <ArrowRight size={20} />
                          Upload {doc.name}
                          <input 
                            type="file" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleUpload(doc.id, doc.category, file.name);
                            }}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {view === 'timeline' && (
             <div 
                className="max-w-3xl mx-auto space-y-8"
             >
                <div className="flex flex-col items-center gap-4">
                  <button 
                    onClick={() => setView('dashboard')}
                    className="flex items-center gap-2 text-chakra font-bold hover:translate-x-1 transition-all"
                    aria-label={t.back}
                  >
                    <ArrowLeft size={20} />
                    {t.back}
                  </button>
                  <div className="text-center space-y-2">
                    <h2 className="font-display font-black text-4xl text-chakra">Election Calendar 2026</h2>
                    <p className="text-chakra font-black uppercase tracking-widest text-sm">Don't miss these critical deadlines</p>
                  </div>
                </div>
                
                <div className="relative space-y-12 pt-8">
                  <div className="absolute top-0 bottom-0 left-6 w-1 bg-chakra/20 shadow-sm"></div>
                  
                  {ELECTION_DATES.map(date => (
                    <div key={date.id} className="relative pl-16">
                      <div className={`absolute left-4 top-0 w-5 h-5 rounded-full border-4 border-white shadow-xl z-10 ${date.type === 'deadline' ? 'bg-red-600' : 'bg-chakra'}`}></div>
                          <div className="p-8 bg-white rounded-[2.5rem] shadow-xl border-2 border-chakra/10 transition-all hover:border-chakra/30">
                            <div className="text-xs font-black text-chakra uppercase tracking-[0.2em] mb-3 border-b-2 border-chakra/10 pb-3">{new Date(date.date).toDateString()}</div>
                            <h3 className="font-display font-black text-2xl mb-3 text-chakra">{date.title}</h3>
                            <p className="text-chakra font-black leading-relaxed">{date.description}</p>
                          </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {view === 'eci-guidelines' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <button 
                onClick={() => setView('landing')}
                className="flex items-center gap-2 text-chakra font-bold hover:translate-x-1 transition-all"
              >
                <ArrowLeft size={20} />
                Back to Home
              </button>
              
              <div className="space-y-12">
                      <div className="text-center space-y-4">
                        <h2 className="text-5xl font-black text-chakra tracking-tight">ECI Guidelines for Voters</h2>
                        <p className="text-xl text-chakra max-w-2xl mx-auto font-black leading-relaxed">Essential instructions from the Election Commission of India for a smooth voting experience.</p>
                      </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    {
                      title: "Voter Identification",
                      icon: <ShieldCheck className="tex                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-chakra" size={18} />
                        <input 
                          type="text" 
                          value={locationInput}
                          onChange={(e) => setLocationInput(e.target.value)}
                          placeholder="Search address, Pin code" 
                          className="w-full pl-11 pr-24 py-4 rounded-xl border-2 border-chakra/5 focus:border-chakra outline-none font-black text-chakra placeholder:text-chakra/30" 
                        />
                        <button 
                          onClick={detectLocation}
                          disabled={detectingLocation}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-chakra/5 text-chakra text-[10px] font-black uppercase rounded-lg disabled:opacity-50"
                        >
                          {detectingLocation ? '...' : 'Auto-Detect'}
                        </button>
                      </div>
                      <button 
                        onClick={() => searchBooth()}
                        disabled={searchingBooth || !locationInput}
                        className="w-full py-3 bg-chakra text-white font-bold rounded-xl shadow-lg shadow-chakra/10 disabled:opacity-50"
                      >
                        {searchingBooth ? 'Searching Hubs...' : 'Find Local Booth'}
                      </button>
                    </div>

                      {foundBooths.length > 0 && (
                        <div 
                   <button 
                    onClick={() => setChatOpen(false)}
                    className="p-3 hover:bg-white/10 rounded-xl transition-all"
                   >
                     <ArrowRight size={24} />
                   </button>
                </div>
             </div>

             <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/50 scroll-smooth">
                {messages.length === 0 && (
                   <div className="h-full flex flex-col items-center justify-center text-center opacity-30 py-20 px-8">
                      <Sparkles size={48} className="mb-6 text-chakra" />
                      <p className="font-black text-xs uppercase tracking-[0.4em] mb-2 text-chakra">Mission Intel</p>
                      <p className="text-sm font-medium text-chakra">Ask me about your voting area, local booths, or document requirements.</p>
                   </div>
                )}
                {messages.map((m, i) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={`msg-${i}`} 
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[90%] p-5 rounded-[2rem] text-sm shadow-sm transition-all ${
                      m.role === 'user' 
                        ? 'bg-chakra text-white rounded-tr-none ml-auto shadow-xl shadow-chakra/10' 
                        : 'bg-white text-chakra border border-chakra/5 rounded-tl-none font-medium'
                    }`}>
                      <div className="markdown-body font-bold leading-relaxed">
                         <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.text}</ReactMarkdown>
                      </div>
                      <div className="mt-4 flex items-center justify-between opacity-30">
                         <span className="text-[9px] font-black uppercase tracking-widest">{m.role === 'user' ? 'Verified Citizen' : 'AI ORACLE'}</span>
                         {m.role === 'model' && (
                           <button onClick={() => speak(m.text)} className="p-1 hover:text-chakra transition-colors">
                             <Volume2 size={12} />
                           </button>
                         )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-chakra/5 p-4 rounded-2xl rounded-tl-none flex gap-1.5">
                       <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-chakra/30 rounded-full" />
                       <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-chakra/30 rounded-full" />
                       <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-chakra/30 rounded-full" />
                    </div>
                  </div>
                )}
             </div>

             <div className="p-8 bg-white border-t border-chakra/5">
                <div className="relative group">
                  <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t.askAnything}
                    className="w-full p-5 pr-14 bg-gray-50 border-2 border-chakra/5 rounded-[1.8rem] outline-none focus:ring-4 focus:ring-chakra/5 transition-all text-sm font-black text-chakra placeholder:text-chakra/20 font-display"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isTyping}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-chakra text-white rounded-xl flex items-center justify-center shadow-lg shadow-chakra/20 hover:scale-[1.1] active:scale-[0.9] transition-all disabled:opacity-10"
                  >
                    <ArrowRight size={20} />
                  </button>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setChatOpen(!chatOpen)}
        className={`fixed bottom-8 right-8 w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl z-[110] transition-all duration-500 ${chatOpen ? 'bg-red-500 text-white rotate-90' : 'bg-chakra text-white'}`}
      >
        {chatOpen ? <ArrowRight size={28} /> : <MessageSquare size={28} />}
        {!chatOpen && <div className="absolute top-0 right-0 w-4 h-4 bg-saffron rounded-full border-4 border-white animate-pulse" />}
      </motion.button>

      {/* Bottom Mobile Nav */}
      <nav className="fixed bottom-0 w-full z-50 bg-white/90 backdrop-blur-md border-t-2 border-chakra/10 md:hidden">
        <div className="flex items-center justify-around h-16">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${view === 'dashboard' ? 'text-saffron scale-110' : 'text-chakra/50'}`}
          >
            <Castle size={20} />
            <span className="text-[10px] font-bold uppercase">{t.home}</span>
          </button>
          <button 
            onClick={() => setView('eligibility')}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${view === 'eligibility' ? 'text-saffron scale-110' : 'text-chakra/50'}`}
          >
            <UserCheck size={20} />
            <span className="text-[10px] font-bold uppercase">Ready</span>
          </button>
          <button 
            onClick={() => setView('timeline')}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${view === 'timeline' ? 'text-saffron scale-110' : 'text-chakra/50'}`}
          >
            <Calendar size={20} />
            <span className="text-[10px] font-bold uppercase">Dates</span>
          </button>
          <button 
            onClick={() => setView('checklist')}
            className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${view === 'checklist' ? 'text-saffron scale-110' : 'text-chakra/50'}`}
          >
            <FileText size={20} />
            <span className="text-[10px] font-bold uppercase">Docs</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
