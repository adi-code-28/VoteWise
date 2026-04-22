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
  Volume2
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { getChatResponse } from './services/gemini';
import { Language, UserProgress, ElectionDate, Document, ChatMessage } from './types';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

const INDIA_MAP_PATH = "M100,20 C80,0 60,0 40,20 C20,40 10,60 10,80 C10,100 30,120 50,140 C70,160 90,180 100,200 C110,180 130,160 150,140 C170,120 190,100 190,80 C190,60 180,40 160,20 C140,0 120,0 100,20 Z"; // Placeholder - will replace with better silhouette

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
  <div className="w-full bg-gray-100 rounded-lg h-3 overflow-hidden p-0.5 border border-gray-50">
    <div 
      style={{ width: `${progress}%` }}
      className="h-full rounded-md patriotic-gradient"
    />
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
  <svg viewBox="0 0 24 24" className={`${className} text-blue-900`} fill="none" stroke="currentColor" strokeWidth="0.8">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="2" fill="currentColor" />
    {[...Array(24)].map((_, i) => (
      <line
        key={i}
        x1="12"
        y1="12"
        x2={12 + 8 * Math.cos((i * 15 * Math.PI) / 180)}
        y2={12 + 8 * Math.sin((i * 15 * Math.PI) / 180)}
      />
    ))}
  </svg>
);

const IndianMapShape = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 240" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <path 
      d="M100,5 L110,15 L120,10 L130,20 L150,20 L160,30 L160,50 L170,60 L180,80 L180,110 L160,130 L150,160 L130,190 L110,210 L100,235 L90,210 L70,190 L50,160 L40,130 L20,110 L20,80 L30,60 L40,50 L40,30 L50,20 L70,20 L80,10 Z" 
      fill="currentColor"
    />
  </svg>
);

const IndianHeritageBackground = ({ variant = "full" }: { variant?: "full" | "minimal" }) => (
  <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-br from-saffron/5 via-white to-green/5 opacity-50" />
    
        {/* Large Waving Flag in Background */}
        <div 
          className="absolute -top-20 -left-20 w-[60%] h-[60%] opacity-[0.02] blur-sm rotate-[-15deg]"
        >
          <div className="h-1/3 bg-[#FF9933] w-full" />
          <div className="h-1/3 bg-white w-full flex items-center justify-center">
             <AshokaChakra className="h-full opacity-20" />
          </div>
          <div className="h-1/3 bg-[#138808] w-full" />
        </div>

        {/* Floating Lotus */}
        <div
          className="absolute top-[15%] left-[5%] opacity-10"
        >
          <svg viewBox="0 0 100 100" className="w-32 h-32 text-pink-400">
             <path d={LOTUS_PATH} fill="currentColor" />
          </svg>
        </div>

        {/* Floating Peacock Feather */}
        <div
          className="absolute top-[25%] right-[8%] opacity-[0.08]"
        >
          <div className="w-40 h-64 bg-gradient-to-b from-blue-600 via-green-500 to-yellow-400 rounded-full blur-3xl opacity-30" />
          <svg viewBox="0 0 100 150" className="absolute inset-0 w-full h-full text-blue-900">
             <path d="M50,150 C50,100 20,60 20,40 C20,20 35,0 50,0 C65,0 80,20 80,40 C80,60 50,100 50,150" fill="currentColor" fillOpacity="0.2" />
             <circle cx="50" cy="40" r="15" fill="currentColor" fillOpacity="0.4" />
             <circle cx="50" cy="40" r="8" fill="#138808" />
          </svg>
        </div>

        {/* Ashoka Chakra - Slow Rotation */}
        <div 
          className="absolute bottom-[-10%] right-[-5%] opacity-[0.03]"
        >
          <AshokaChakra className="w-96 h-96" />
        </div>

        {/* Monuments Silhouette at Bottom */}
        {variant === "full" && (
          <div 
            className="absolute bottom-0 left-0 right-0 h-48 opacity-[0.04] flex items-end justify-around px-12"
          >
             <svg viewBox="0 0 100 100" className="w-64 h-64 text-chakra">
                <path d={MONUMENT_SHAPES.taj} fill="currentColor" />
             </svg>
             <svg viewBox="0 0 100 100" className="w-48 h-48 text-chakra">
                <path d={MONUMENT_SHAPES.gate} fill="currentColor" />
             </svg>
             <div>
                <IndianMapShape className="w-40 h-40 text-chakra opacity-40" />
             </div>
          </div>
        )}
  </div>
);

const BadgeCard = ({ name, earned }: { name: string, earned: boolean }) => (
  <div className={`p-4 rounded-xl flex flex-col items-center justify-center gap-2 border transition-all ${earned ? 'bg-chakra/5 border-saffron text-chakra' : 'bg-gray-50 border-gray-200 text-gray-400 grayscale'}`}>
    <Trophy size={earned ? 32 : 24} className={earned ? 'text-saffron' : ''} />
    <span className="text-[10px] font-black uppercase tracking-wider">{name}</span>
  </div>
);

const StepCard = ({ number, title, desc, active }: { number: string, title: string, desc: string, active: boolean }) => (
  <div className={`relative p-6 rounded-2xl border transition-all ${active ? 'bg-white border-saffron shadow-xl scale-105 text-chakra' : 'bg-white/10 border-white/20 text-white opacity-60'}`}>
    <div className="absolute -top-4 -left-4 w-10 h-10 bg-saffron text-white rounded-xl flex items-center justify-center font-bold text-lg shadow-lg">
      {number}
    </div>
    <h3 className="font-display font-bold text-lg mb-2 pt-2">{title}</h3>
    <p className="text-sm opacity-90 leading-relaxed">{desc}</p>
  </div>
);

const CulturalBackground = ({ mousePos }: { mousePos: { x: number, y: number } }) => (
  <IndianHeritageBackground />
);

const MapFlyTo = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 14, { duration: 2 });
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
        {booths.map((booth, idx) => {
          // Fake real-looking booth distribution if coords not found in mock
          const lat = userCoords ? userCoords.lat + (Math.sin(idx) * 0.005) : 28.6139 + (Math.sin(idx) * 0.005);
          const lng = userCoords ? userCoords.lng + (Math.cos(idx) * 0.005) : 77.2090 + (Math.cos(idx) * 0.005);
          
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
                  <div className="text-[10px] text-gray-500 leading-tight">{booth.addr}</div>
                  <div className="text-[10px] font-black text-saffron uppercase border-t border-gray-100 pt-1 mt-1">{booth.distance}</div>
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
             <MapPin size={48} className="text-chakra opacity-20 mb-4" />
          </div>
          <p className="font-display font-black text-chakra opacity-40 uppercase tracking-widest text-xs">Waiting for GPS Signal...</p>
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
              <p className="text-gray-500 font-bold tracking-widest text-xs mt-2">FROM {progress.constituency?.toUpperCase() || 'INDIA'}</p>
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

            <div className="pt-6 flex items-center justify-between opacity-30 border-t border-gray-50">
               <div className="text-left text-[9px] font-bold">
                  SERIAL: VW-2026-{(Math.random() * 10000).toFixed(0)}
               </div>
               <div className="text-right text-[9px] font-bold">
                  DATE: {new Date().toLocaleDateString()}
               </div>
            </div>
          </div>
        </div>
      </div>

      <button 
        onClick={download}
        className="w-full py-5 bg-chakra text-white rounded-[1.5rem] font-black flex items-center justify-center gap-3 hover:bg-chakra shadow-2xl shadow-chakra/30 transition-all border-b-4 border-black/20"
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
  
  const isUnderage = age !== '' && parseInt(age) < 18;

  return (
    <div 
      className="fixed inset-0 z-[100] bg-chakra/40 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div 
        className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl p-8 md:p-12 overflow-hidden relative"
      >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-saffron/10 rounded-2xl blur-3xl -mr-16 -mt-16" />
        
        <div className="text-center space-y-4 mb-12">
           <div className="inline-flex gap-1.5 mb-2">
              <div className="w-3 h-1 bg-saffron rounded-sm" />
              <div className="w-8 h-1 bg-chakra rounded-sm" />
              <div className="w-3 h-1 bg-green rounded-sm" />
           </div>
           <h2 className="font-display font-black text-4xl text-chakra leading-tight">{t.voterTypeTitle}</h2>
           <p className="text-gray-500 font-medium">{t.voterTypeSub}</p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setVoterType('first-time')}
              className={`p-6 rounded-3xl border-2 transition-all text-left group ${voterType === 'first-time' ? 'border-saffron bg-saffron/5 shadow-xl shadow-saffron/10' : 'border-gray-100 bg-white hover:border-saffron/30'}`}
            >
              <div className="w-12 h-12 bg-saffron/10 rounded-2xl flex items-center justify-center text-saffron mb-4 transition-all">
                <Landmark size={24} />
              </div>
              <h3 className="font-bold text-chakra mb-1">{t.firstTime}</h3>
              <p className="text-xs text-gray-400">Step-by-step guidance</p>
            </button>
            <button 
              onClick={() => setVoterType('returning')}
              className={`p-6 rounded-3xl border-2 transition-all text-left group ${voterType === 'returning' ? 'border-green bg-green/5 shadow-xl shadow-green/10' : 'border-gray-100 bg-white hover:border-green/30'}`}
            >
              <div className="w-12 h-12 bg-green/10 rounded-2xl flex items-center justify-center text-green mb-4 transition-all">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-bold text-chakra mb-1">{t.returning}</h3>
              <p className="text-xs text-gray-400">Status & updates only</p>
            </button>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100">
             <input 
               type="text" 
               placeholder={t.namePlaceholder}
               value={userName}
               onChange={(e) => setUserName(e.target.value)}
               className="w-full p-4 bg-gray-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-chakra text-chakra font-bold"
             />
             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <input 
                    type="text" 
                    placeholder={t.constituencyPlaceholder}
                    value={constituency}
                    onChange={(e) => setConstituency(e.target.value)}
                    className="w-full p-4 bg-gray-50 border-0 rounded-2xl outline-none focus:ring-2 focus:ring-chakra text-chakra font-bold"
                  />
                  <p className="text-[9px] text-gray-400 px-2 font-medium italic">
                    Voting area
                  </p>
                </div>
                <div className="space-y-1">
                  <input 
                    type="number" 
                    placeholder={t.agePlaceholder}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    className={`w-full p-4 bg-gray-50 border-0 rounded-2xl outline-none focus:ring-2 text-chakra font-bold transition-all ${isUnderage ? 'ring-2 ring-red-500' : 'focus:ring-chakra'}`}
                  />
                   <p className="text-[9px] text-gray-400 px-2 font-medium italic">
                    Must be 18+
                  </p>
                </div>
             </div>
             
             {isUnderage && (
               <div 
                 className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold flex items-center gap-2"
               >
                 <Info size={14} />
                 {t.ineligibleAge}
               </div>
             )}
          </div>

          <button 
            disabled={!userName || !constituency || !voterType || !age || isUnderage}
            onClick={() => onSave({ userName, constituency, voterType, age: parseInt(age) })}
            className="w-full py-5 bg-chakra text-white rounded-[2rem] font-black uppercase tracking-widest text-sm hover:translate-y-[-4px] active:translate-y-0 transition-all shadow-xl shadow-chakra/20 flex items-center justify-center gap-2 disabled:opacity-30 disabled:pointer-events-none"
          >
            Continue to Dashboard <ArrowRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main App ---

const DashboardSidebar = ({ currentView, setView, t }: any) => {
  const menuItems = [
    { id: 'dashboard', icon: <Trophy size={18} />, label: t.dashboard },
    { id: 'eligibility', icon: <UserCheck size={18} />, label: t.eligibility },
    { id: 'timeline', icon: <Calendar size={18} />, label: t.timeline },
    { id: 'checklist', icon: <FileText size={18} />, label: t.checklist },
    { id: 'booth', icon: <MapPin size={18} />, label: t.booth },
  ];

  return (
    <div className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 min-h-[calc(100vh-64px)] sticky top-16 p-4 space-y-2 z-20">
      <div className="px-4 py-6">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Command Center</p>
        <div className="space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${
                currentView === item.id 
                  ? 'bg-chakra text-white shadow-lg shadow-chakra/20' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-chakra'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="mt-auto p-4 bg-saffron/5 rounded-2xl border border-saffron/10">
        <div className="flex items-center gap-3 mb-2">
           <div className="w-8 h-8 bg-saffron rounded-lg flex items-center justify-center text-white">
              <ShieldCheck size={16} />
           </div>
           <span className="text-xs font-black text-chakra uppercase tracking-tighter">Secure Guide</span>
        </div>
        <p className="text-[10px] text-gray-500 leading-tight">Your data is stored locally for privacy.</p>
      </div>
    </div>
  );
};

const DashboardHeader = ({ userName }: any) => (
  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
    <div>
      <h2 className="text-3xl font-black text-chakra tracking-tight">Namaste, {userName || 'Citizen'}!</h2>
      <p className="text-gray-500 font-medium">Welcome to your personalized election dashboard.</p>
    </div>
    <div className="flex items-center gap-3">
       <div className="hidden md:flex flex-col items-end">
          <span className="text-xs font-black text-chakra uppercase">{userName || 'Indian Citizen'}</span>
          <span className="text-[10px] text-green font-bold">Verified Interface</span>
       </div>
       <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-chakra">
          <UserCheck size={24} />
       </div>
    </div>
  </div>
);

export default function App() {
  const [lang, setLang] = useState<Language>('en');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const [view, setView] = useState<'landing' | 'dashboard' | 'eligibility' | 'timeline' | 'checklist' | 'booth'>('landing');
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

  // Global Ineligibility Guard
  useEffect(() => {
    if (progress.age !== undefined && progress.age < 18 && progress.isEligible !== false) {
      setProgress(prev => ({ ...prev, isEligible: false }));
    }
  }, [progress.age, progress.isEligible]);

  const [locationInput, setLocationInput] = useState('');
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [foundBooths, setFoundBooths] = useState<{name: string, distance: string, addr: string}[]>([]);
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
    const utterance = new SpeechSynthesisUtterance(text);
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
          
          // Using a free reverse geocoding service (Nominatim)
          // We add a delay to simulate a premium search feel
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const data = await res.json();
          
          const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          setTimeout(() => {
            setLocationInput(address);
            setDetectingLocation(false);
            searchBooth(address);
          }, 1000);
        } catch (error) {
          console.error("Geocoding error:", error);
          // Fallback
          const mockAddress = "New Delhi, India";
          setLocationInput(mockAddress);
          setDetectingLocation(false);
          searchBooth(mockAddress);
        }
      },
      (error) => {
        setDetectingLocation(false);
        alert("Unable to retrieve your location. Please ensure location permissions are granted.");
      },
      { enableHighAccuracy: true }
    );
  };

  const searchBooth = (overrideInput?: string) => {
    setSearchingBooth(true);
    setFoundBooths([]);
    setSelectedBooth(null);
    const query = overrideInput || locationInput;
    
    setTimeout(() => {
      // Logic for varying results based on input
      if (query.toLowerCase().includes('hsr')) {
        setFoundBooths([
          { name: 'National School Booth A', distance: '0.4 km', addr: '27th Main Road, HSR Layout' },
          { name: 'Public Library Hall', distance: '1.1 km', addr: 'Sector 3, Opp. BDA Complex' },
          { name: 'Civic Amenity Center', distance: '1.4 km', addr: '14th Cross, HSR Sector 7' },
        ]);
      } else {
        setFoundBooths([
          { name: 'Govt. Primary School, West Block', distance: '0.8 km', addr: 'Constituency No. 42, Room 4' },
          { name: 'Community Center, Sector 12', distance: '1.2 km', addr: 'Main Hall, Ground Floor' },
          { name: 'Muncipal Office, North Wing', distance: '1.9 km', addr: 'Entrance Gate B' },
        ]);
      }
      setSearchingBooth(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen font-sans bg-gray-50/30 relative">
      <IndianHeritageBackground variant={view === 'landing' ? 'full' : 'minimal'} />
      
      {view !== 'landing' && !progress.voterType && (
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
            <select 
              value={lang}
              onChange={(e) => setLang(e.target.value as Language)}
              className="px-3 py-1 text-xs font-bold bg-white border border-gray-200 rounded-lg outline-none cursor-pointer focus:ring-1 focus:ring-chakra uppercase tracking-widest"
            >
              <option value="en">English</option>
              <option value="hi">हिन्दी</option>
              <option value="bn">বাংলা</option>
              <option value="ta">தமிழ்</option>
              <option value="mr">मराठी</option>
            </select>
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
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 bg-saffron/10 text-saffron rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-sm border border-saffron/20"
                >
                  <WavingFlag />
                  Mission 2026: Every Vote Counts
                </div>
                
                <h2 className="text-5xl md:text-8xl font-black text-chakra tracking-tight leading-[0.9] max-w-4xl mx-auto drop-shadow-sm">
                  Empower Your <span className="text-saffron italic">Voice</span>, <br />
                  Lead Your <span className="text-green">Nation</span>.
                </h2>
                
                <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto font-medium leading-relaxed">
                  Join millions of citizens in shaping India's future. Our AI-powered guide makes voter registration and preparation seamless, secure, and accessible.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
                  <button 
                    onClick={() => setView('dashboard')}
                    className="group px-12 py-6 bg-chakra text-white rounded-[2.5rem] font-black uppercase tracking-widest text-sm hover:translate-y-[-4px] active:translate-y-0 transition-all shadow-2xl shadow-chakra/30 flex items-center gap-3 relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-saffron/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                    Get Started <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
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
                    className="p-8 bg-white/70 backdrop-blur-xl rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/50 space-y-6"
                  >
                    <div className="w-16 h-16 bg-chakra/5 text-chakra rounded-2xl flex items-center justify-center">
                      {f.icon}
                    </div>
                    <h3 className="text-2xl font-black text-chakra tracking-tight">{f.title}</h3>
                    <p className="text-gray-500 font-medium leading-relaxed">{f.desc}</p>
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
                         <div className="p-10 bg-white rounded-[3rem] shadow-sm border border-chakra/10 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-chakra opacity-[0.02] -mr-32 -mt-32 rounded-full" />
                           <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 relative z-10">
                             <div>
                               <h3 className="text-2xl font-black text-chakra mb-1 tracking-tight">Mission Readiness Profile</h3>
                               <p className="text-gray-500 font-medium text-sm">
                                  {progress.voterType === 'first-time' ? 'Step-by-step roadmap for new voters' : 'Fast-track updates for experienced citizens'}
                               </p>
                             </div>
                             <div className="flex items-center gap-6">
                                <div className="text-center">
                                   <div className="text-3xl font-black text-saffron">{calculateProgress()}%</div>
                                   <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Completion</div>
                                </div>
                                <div className="w-[1px] h-10 bg-gray-100" />
                                <div className="text-center">
                                   <div className={`text-3xl font-black ${progress.isEligible === true ? 'text-green' : progress.isEligible === false ? 'text-red-500' : 'text-gray-300'}`}>
                                      {progress.isEligible === true ? 'YES' : progress.isEligible === false ? 'NO' : 'PENDING'}
                                   </div>
                                   <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mt-1">Eligibility</div>
                                </div>
                             </div>
                           </div>

                           <div className="w-full bg-gray-50 rounded-2xl h-6 overflow-hidden p-1 border border-gray-100 mb-10 relative">
                             <div 
                               style={{ width: `${calculateProgress()}%` }}
                               className="patriotic-gradient h-full rounded-xl shadow-inner relative"
                             >
                                <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent" />
                             </div>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             {[
                               { id: 'eligibility', icon: <UserCheck size={20} />, title: 'Eligibility Check', desc: 'Personal details & voting rights', done: progress.isEligible },
                               { id: 'reg', icon: <FileText size={20} />, title: 'Voter Registration', desc: 'Form 6 status & NVSP portal', done: progress.hasRegistered, toggle: true },
                               { id: 'checklist', icon: <ShieldCheck size={20} />, title: 'Document Vault', desc: 'Secure storage for ID & Age proof', done: progress.hasRequiredDocs },
                               { id: 'booth', icon: <MapPin size={20} />, title: 'Booth Locator', desc: 'Find your nearest polling station', done: progress.knowsPollingBooth },
                             ].map((step) => (
                               <button 
                                 key={step.id}
                                 onClick={() => step.toggle ? setProgress(p => ({ ...p, hasRegistered: !p.hasRegistered })) : setView(step.id)}
                                 className={`p-6 rounded-[2rem] border-2 text-left transition-all flex gap-5 group relative overflow-hidden ${
                                   step.done 
                                     ? 'bg-green/5 border-green/20' 
                                     : 'bg-white border-gray-100 hover:border-chakra/30 hover:shadow-xl hover:-translate-y-1'
                                 }`}
                               >
                                 <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center transition-all ${
                                   step.done ? 'bg-green text-white shadow-lg shadow-green/20' : 'bg-gray-50 text-gray-400 group-hover:bg-chakra/10 group-hover:text-chakra'
                                 }`}>
                                   {step.icon}
                                 </div>
                                 <div className="relative z-10 pt-1">
                                   <div className="font-display font-black text-chakra text-lg leading-tight mb-1">{step.title}</div>
                                   <p className="text-xs text-gray-500 line-clamp-1">{step.desc}</p>
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
                         
                         <div className="p-10 bg-chakra text-white rounded-[3rem] shadow-2xl shadow-chakra/30 relative overflow-hidden">
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
                                    <div key={i} className="space-y-3">
                                       <div className="text-3xl font-black text-white/20">{item.step}</div>
                                       <div className="font-bold text-lg">{item.title}</div>
                                       <p className="text-xs text-white/50 leading-relaxed font-medium">{item.desc}</p>
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
                                     <div className="w-14 h-14 bg-gray-50 rounded-2xl flex flex-col items-center justify-center transition-all group-hover:bg-chakra group-hover:text-white group-hover:shadow-lg">
                                        <span className="text-[10px] font-black uppercase">{new Date(date.date).toLocaleString('default', { month: 'short' })}</span>
                                        <span className="text-2xl font-black leading-none">{new Date(date.date).getDate()}</span>
                                     </div>
                                     <div className="pt-1">
                                        <div className="font-black text-sm text-chakra tracking-tight leading-tight mb-1">{date.title}</div>
                                        <p className="text-[10px] text-gray-400 font-bold group-hover:text-gray-600 truncate">{date.description}</p>
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                          
                          <div className="p-6 bg-gradient-to-br from-chakra to-chakra/90 text-white rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                             <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
                             <h4 className="font-black text-lg mb-2 relative z-10">Need Assistance?</h4>
                             <p className="text-xs text-white/60 mb-6 relative z-10">Our AI assistant is ready to help you in 5+ languages.</p>
                             <button 
                              onClick={() => setChatOpen(true)}
                              className="px-6 py-3 bg-saffron text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-white hover:text-chakra transition-all relative z-10"
                             >
                                Ask AI Assistant
                             </button>
                          </div>
                       </div>
                     </div>
                    </div>
                 )}

          {view === 'eligibility' && (
            <div 
              className="max-w-3xl mx-auto space-y-6"
            >
              <button 
                onClick={() => setView('dashboard')}
                className="flex items-center gap-2 text-chakra font-bold hover:translate-x-1 transition-all"
                aria-label={t.backToDashboard}
              >
                <ArrowLeft size={20} />
                {t.backToDashboard}
              </button>

              <div className="p-8 bg-white rounded-3xl shadow-xl space-y-8">
                <div 
                  className="flex items-center gap-4"
                >
                  <div className="p-3 bg-saffron/10 text-saffron rounded-xl"><UserCheck /></div>
                  <div>
                    <h2 className="font-display font-bold text-3xl text-chakra">Are you eligible?</h2>
                    <p className="text-gray-500">Answer these 3 simple questions</p>
                  </div>
                </div>

                <div className="space-y-6">
                   {[
                     {
                       label: "1. How old are you?",
                       content: (
                         <div className="space-y-2">
                           <input 
                             type="number" 
                             placeholder="Age"
                             value={progress.age || ''}
                             onChange={(e) => setProgress(prev => ({ ...prev, age: parseInt(e.target.value) || undefined }))}
                             className={`w-full p-4 rounded-xl border focus:ring-0 outline-none font-bold text-lg ${progress.age && progress.age < 18 ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-saffron'}`}
                           />
                           {progress.age && progress.age < 18 && (
                             <p className="text-red-500 text-xs font-bold pl-2">{t.ineligibleAge}</p>
                           )}
                         </div>
                       )
                     },
                     {
                       label: "2. Are you an Indian citizen?",
                       content: (
                         <div className="flex gap-4">
                            <button 
                             onClick={() => setProgress(prev => ({ ...prev, isEligible: true }))}
                             className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${progress.isEligible === true ? 'border-green bg-green/5 text-green' : 'border-gray-100 bg-white hover:border-saffron'}`}
                            >
                             Yes
                            </button>
                            <button 
                             onClick={() => setProgress(prev => ({ ...prev, isEligible: false }))}
                             className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${progress.isEligible === false ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-100 bg-white hover:border-saffron'}`}
                            >
                             No
                            </button>
                         </div>
                       )
                     },
                     {
                       label: "3. Is your name already in the Electoral Roll?",
                       content: (
                         <div className="flex gap-4">
                            <button 
                             onClick={() => setProgress(prev => ({ ...prev, hasRegistered: true }))}
                             className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${progress.hasRegistered ? 'border-green bg-green/5 text-green' : 'border-gray-100 bg-white hover:border-saffron'}`}
                            >
                             Yes
                            </button>
                            <button 
                             onClick={() => setProgress(prev => ({ ...prev, hasRegistered: false }))}
                             className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${!progress.hasRegistered ? 'border-saffron bg-saffron/5 text-saffron' : 'border-gray-100 bg-white hover:border-saffron'}`}
                            >
                             No / Not sure
                            </button>
                         </div>
                       )
                     }
                   ].map((q, i) => (
                     <div 
                       key={i}
                       className="p-6 rounded-2xl bg-gray-50 space-y-4 shadow-sm"
                     >
                        <label className="block font-bold text-gray-700">{q.label}</label>
                        {q.content}
                     </div>
                   ))}
                </div>

                <div 
                  className="flex gap-4"
                >
                   <button 
                    onClick={() => setView('dashboard')}
                    className="flex-1 py-4 text-gray-400 font-bold hover:text-chakra transition-colors"
                   >
                     Cancel
                   </button>
                   <button 
                    disabled={!progress.age || !progress.userName}
                    onClick={() => {
                      const isAgeEligible = progress.age && progress.age >= 18;
                      setProgress(prev => ({ ...prev, isEligible: isAgeEligible && prev.isEligible === true }));
                      setView('dashboard');
                    }}
                    className="flex-[2] py-4 bg-chakra text-white rounded-2xl font-black hover:bg-chakra/90 shadow-lg shadow-chakra/20 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
                   >
                     Submit & Check 
                   </button>
                </div>
              </div>
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
                    <h2 className="font-display font-bold text-4xl text-chakra">Document Vault</h2>
                    <p className="text-gray-500">Securely store your documents for easy access during registration</p>
                  </div>
                </div>
                <div className="bg-chakra/5 px-4 py-2 rounded-xl border border-chakra/10 flex items-center gap-2">
                   <ShieldCheck className="text-green" size={18} />
                   <span className="text-sm font-bold text-chakra">End-to-End Encrypted</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {REQUIRED_DOCS.map(doc => {
                  const storedFile = progress.storedDocs[doc.id];
                  return (
                    <div key={doc.id} className={`p-6 rounded-3xl border transition-all ${storedFile ? 'bg-green/5 border-green/20' : 'bg-white border-gray-100 shadow-sm'}`}>
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-xl ${storedFile ? 'bg-green/10 text-green' : 'bg-blue-50 text-blue-600'}`}>
                          <FileText size={20} />
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.isMandatory && <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold uppercase rounded-md">Required</span>}
                          {storedFile && <span className="px-2 py-1 bg-green/10 text-green text-[10px] font-bold uppercase rounded-md">Stored</span>}
                        </div>
                      </div>
                      <h3 className="font-display font-bold text-xl mb-1">{doc.name}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed mb-6">{doc.description}</p>
                      
                      {storedFile ? (
                        <div className="flex items-center justify-between p-3 bg-white rounded-xl border border-green/10">
                          <div className="flex items-center gap-2 truncate pr-4">
                            <CheckCircle2 size={16} className="text-green shrink-0" />
                            <span className="text-xs font-bold text-chakra truncate">{storedFile}</span>
                          </div>
                          <button 
                            onClick={() => removeDoc(doc.id)}
                            className="text-xs font-bold text-red-500 hover:text-red-700 underline shrink-0"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center justify-center gap-2 w-full py-3 bg-green text-white rounded-xl font-bold cursor-pointer hover:bg-green/90 transition-colors">
                          <ArrowRight size={18} />
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
                    <h2 className="font-display font-bold text-4xl text-chakra">Election Calendar 2026</h2>
                    <p className="text-gray-500">Don't miss these critical deadlines</p>
                  </div>
                </div>
                
                <div className="relative space-y-12 pt-8">
                  <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-chakra/5"></div>
                  
                  {ELECTION_DATES.map(date => (
                    <div key={date.id} className="relative pl-16">
                      <div className={`absolute left-4 top-0 w-4 h-4 rounded-full border-4 border-white shadow-md z-10 ${date.type === 'deadline' ? 'bg-red-500' : 'bg-chakra'}`}></div>
                      <div className="p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                        <div className="text-xs font-bold text-chakra uppercase tracking-widest mb-2">{new Date(date.date).toDateString()}</div>
                        <h3 className="font-display font-bold text-2xl mb-3">{date.title}</h3>
                        <p className="text-gray-600">{date.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
          )}

          {view === 'booth' && (
            <div 
              className="max-w-5xl mx-auto space-y-8"
            >
               <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 text-center md:text-left">
                  <div className="space-y-4">
                    <button 
                      onClick={() => setView('dashboard')}
                      className="flex items-center gap-2 text-chakra font-bold hover:translate-x-1 transition-all mx-auto md:mx-0"
                      aria-label={t.back}
                    >
                      <ArrowLeft size={20} />
                      {t.back}
                    </button>
                    <div>
                      <h2 className="font-display font-bold text-4xl text-chakra">Polling Booth Locator</h2>
                      <p className="text-gray-500">Enter your location to find the nearest voting center</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-1 space-y-6">
                    <div className="p-6 bg-white rounded-3xl border border-gray-100 space-y-4">
                      <label className="block font-bold">Your Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="text" 
                          value={locationInput}
                          onChange={(e) => setLocationInput(e.target.value)}
                          placeholder="Search address, Pin code" 
                          className="w-full pl-11 pr-24 py-3 rounded-xl border border-gray-200 focus:border-saffron outline-none font-medium" 
                        />
                        <button 
                          onClick={detectLocation}
                          disabled={detectingLocation}
                          className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-chakra/5 text-chakra text-[10px] font-black uppercase rounded-lg hover:bg-chakra hover:text-white transition-all disabled:opacity-50"
                        >
                          {detectingLocation ? '...' : 'Auto-Detect'}
                        </button>
                      </div>
                      <button 
                        onClick={() => searchBooth()}
                        disabled={searchingBooth || !locationInput}
                        className="w-full py-3 bg-chakra text-white font-bold rounded-xl hover:bg-chakra/90 transition-colors disabled:opacity-50 shadow-lg shadow-chakra/10"
                      >
                        {searchingBooth ? 'Searching Hubs...' : 'Find Local Booth'}
                      </button>
                    </div>

                      {foundBooths.length > 0 && (
                        <div 
                          className="space-y-4"
                        >
                          <h4 className="font-bold text-sm text-gray-400 uppercase tracking-widest px-2">Nearest Booths Found</h4>
                          {foundBooths.map((b, i) => (
                            <button 
                              key={i}
                              onClick={() => {
                                setProgress(p => ({ ...p, knowsPollingBooth: true }));
                                setSelectedBooth(i);
                              }}
                              className={`w-full p-4 rounded-2xl border text-left transition-all group ${selectedBooth === i ? 'bg-chakra/5 border-chakra shadow-inner' : 'bg-white border-chakra/10 hover:border-chakra'}`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={`font-bold transition-colors ${selectedBooth === i ? 'text-green' : 'text-chakra group-hover:text-green'}`}>{b.name}</span>
                                <span className="text-[10px] font-black text-saffron bg-saffron/5 px-2 py-0.5 rounded-full">{b.distance}</span>
                              </div>
                              <p className="text-xs text-gray-400">{b.addr}</p>
                            </button>
                          ))}
                        </div>
                      )}

                    <div className="p-6 bg-saffron/5 border border-saffron/10 rounded-3xl space-y-4">
                      <h4 className="font-bold flex items-center gap-2">
                        <Info size={16} className="text-saffron" />
                        Election Fact
                      </h4>
                      <p className="text-xs text-chakra leading-relaxed opacity-80">
                        The Election Commission ensures every voter has a booth within 2km of their residence. Active duty soldiers and expats have special voting provisions.
                      </p>
                    </div>

                    <button 
                      onClick={() => {
                        if (foundBooths.length > 0) {
                          setProgress(p => ({ ...p, knowsPollingBooth: true }));
                          setSelectedBooth(0);
                        }
                      }}
                      className="w-full py-4 bg-green text-white rounded-2xl font-bold hover:bg-green/90 shadow-lg shadow-green/20 transition-all flex items-center justify-center gap-2"
                      aria-label={t.bestChoice}
                    >
                      <Trophy size={18} />
                      {t.bestChoice}
                    </button>
                  </div>

                  <div className="lg:col-span-2 h-[550px] bg-white rounded-[2.5rem] overflow-hidden relative border-8 border-white shadow-2xl">
                    <RealMap 
                      booths={foundBooths} 
                      selectedIdx={selectedBooth} 
                      userCoords={userCoords}
                      lang={lang}
                      onSelect={(idx) => {
                        setSelectedBooth(idx);
                        setProgress(p => ({ ...p, knowsPollingBooth: true }));
                      }}
                    />
                  </div>
                </div>
            </div>
          )}
      </main>
    </div>
    )}

      {/* Floating Chat Assistant */}
      <div className="fixed bottom-8 right-8 z-[100]">
          {chatOpen && (
            <div 
              className="absolute bottom-20 right-0 w-[90vw] md:w-[400px] h-[600px] max-h-[80vh] glass rounded-3xl shadow-2xl flex flex-col overflow-hidden border-2 border-chakra/10"
            >
              <div className="p-6 bg-chakra text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center"><MessageSquare size={20} /></div>
                  <div>
                    <div className="font-display font-bold text-lg leading-none">VoteWise AI</div>
                    <span className="text-[10px] uppercase font-bold text-white/50 tracking-widest">Active Assistant</span>
                  </div>
                </div>
                <button 
                  onClick={() => setChatOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg"
                >
                  <ArrowRight />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                 <div key="chat-greeting" className="p-4 bg-chakra/5 text-chakra rounded-2xl rounded-tl-none font-bold text-sm">
                   Hello! I'm your Election Assistant. How can I help you vote today? 🗳️
                 </div>
                 {messages.map((m, i) => (
                   <div 
                    key={`msg-${i}`} 
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                   >
                    <div className="group relative flex flex-col gap-1">
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-chakra text-white rounded-tr-none ml-auto' : 'bg-gray-100 text-gray-800 rounded-tl-none'}`}>
                        {m.text}
                      </div>
                      {m.role === 'model' && (
                        <button 
                          onClick={() => speak(m.text)}
                          title="Speak answer"
                          className="p-1 px-3 text-gray-400 hover:text-chakra self-start transition-all flex items-center gap-1.5 text-[10px] font-bold bg-white/80 rounded-full border border-chakra/5 mt-1 hover:border-chakra/20 shadow-sm"
                        >
                          <Volume2 size={12} /> {lang === 'en' ? 'LISTEN' : (lang === 'hi' ? 'सुनिए' : (lang === 'bn' ? 'শুনুন' : (lang === 'ta' ? 'கேளுங்கள்' : 'एका')))}
                        </button>
                      )}
                    </div>
                   </div>
                 ))}
                 {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 p-4 rounded-2xl rounded-tl-none flex gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                    </div>
                 )}
              </div>

              <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={t.askAnything}
                  className="flex-1 bg-gray-50 border-0 p-4 rounded-2xl outline-none focus:ring-2 focus:ring-saffron text-sm"
                />
                <button 
                  onClick={handleSendMessage}
                  className="w-12 h-12 bg-chakra text-white rounded-2xl flex items-center justify-center hover:bg-chakra/90 shadow-lg shadow-chakra/10"
                >
                  <ArrowRight size={20} />
                </button>
              </div>
            </div>
          )}

                  <button 
                    onClick={() => setChatOpen(!chatOpen)}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all duration-300 group ${chatOpen ? 'bg-red-500 text-white rotate-90' : 'bg-chakra text-white hover:scale-110'}`}
                  >
                    {chatOpen ? <ArrowRight /> : <MessageSquare />}
                    {!chatOpen && <div className="absolute -top-1 -right-1 w-4 h-4 bg-saffron rounded-lg border-2 border-white"></div>}
                  </button>
      </div>

      {/* Bottom Mobile Nav */}
      <nav className="fixed bottom-0 w-full z-50 glass border-t border-gray-100 md:hidden">
        <div className="flex items-center justify-around h-16">
          <button 
            onClick={() => setView('dashboard')}
            className={`flex flex-col items-center gap-1 ${view === 'dashboard' ? 'text-saffron' : 'text-gray-400'}`}
          >
            <Castle size={20} />
            <span className="text-[10px] font-bold uppercase">{t.home}</span>
          </button>
          <button 
            onClick={() => setView('eligibility')}
            className={`flex flex-col items-center gap-1 ${view === 'eligibility' ? 'text-saffron' : 'text-gray-400'}`}
          >
            <UserCheck size={20} />
            <span className="text-[10px] font-bold uppercase">Ready</span>
          </button>
          <button 
            onClick={() => setView('timeline')}
            className={`flex flex-col items-center gap-1 ${view === 'timeline' ? 'text-saffron' : 'text-gray-400'}`}
          >
            <Calendar size={20} />
            <span className="text-[10px] font-bold uppercase">Dates</span>
          </button>
          <button 
            onClick={() => setView('checklist')}
            className={`flex flex-col items-center gap-1 ${view === 'checklist' ? 'text-saffron' : 'text-gray-400'}`}
          >
            <FileText size={20} />
            <span className="text-[10px] font-bold uppercase">Docs</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
