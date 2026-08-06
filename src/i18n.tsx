import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'so' | 'ar';

interface Translations {
  [key: string]: {
    en: string;
    so: string;
    ar: string;
  };
}

export const translations: Translations = {
  // Navigation
  "Dashboard": { en: "Dashboard", so: "Dashboard-ka", ar: "لوحة القيادة" },
  "Register Citizen": { en: "Register Citizen", so: "Diiwaangeli Muwaadin", ar: "تسجيل مواطن" },
  "Citizens List": { en: "Citizens List", so: "Liiska Muwaadiniinta", ar: "قائمة المواطنين" },
  "ID Card Preview": { en: "ID Card Preview", so: "Arag Kaadhka", ar: "معاينة البطاقة" },
  "QR Verification": { en: "QR Verification", so: "Xaqiijinta QR", ar: "التحقق من QR" },
  "Reports": { en: "Reports", so: "Warbixinada", ar: "التقارير" },
  "Settings": { en: "Settings", so: "Goobaha", ar: "الإعدادات" },
  "Main Menu": { en: "Main Menu", so: "Liiska Weyn", ar: "القائمة الرئيسية" },
  "Gov. Secure System": { en: "Gov. Secure System", so: "Nidaamka Dawladda", ar: "نظام حكومي آمن" },
  
  // Topbar
  "Quick search...": { en: "Quick search...", so: "Raadi...", ar: "بحث سريع..." },
  "Admin": { en: "Admin", so: "Maamule", ar: "مسؤول" },
  "Administrator": { en: "Administrator", so: "Maamulaha Guud", ar: "المسؤول العام" },
  "WNIMS": { en: "WNIMS", so: "WNIMS", ar: "WNIMS" },
  "Waqooyi Bari National ID Management System": { 
    en: "Waqooyi Bari National ID Management System", 
    so: "Nidaamka Aqoonsiga Qaranka ee Waqooyi Bari", 
    ar: "نظام إدارة الهوية الوطنية وقويي باري" 
  },
  
  // Settings Page
  "System Settings": { en: "System Settings", so: "Goobaha Nidaamka", ar: "إعدادات النظام" },
  "Manage application preferences": { en: "Manage application preferences", so: "Maamul doorashooyinka", ar: "إدارة تفضيلات التطبيق" },
  "Language": { en: "Language", so: "Luuqadda", ar: "اللغة" },
  "Select language for the system": { en: "Select language for the system", so: "Dooro luuqadda nidaamka", ar: "اختر لغة النظام" },
  "English": { en: "English", so: "Ingiriis", ar: "الإنجليزية" },
  "Somali": { en: "Somali", so: "Soomaali", ar: "الصومالية" },
  "Arabic": { en: "Arabic", so: "Carabi", ar: "العربية" },
  "Organization Logo": { en: "Organization Logo", so: "Astaanta Hay'adda", ar: "شعار المنظمة" },
  "System Information": { en: "System Information", so: "Xogta Nidaamka", ar: "معلومات النظام" },
  "Version": { en: "Version", so: "Nooca", ar: "الإصدار" },
  "Last Updated": { en: "Last Updated", so: "Markii ugu dambeysay", ar: "اخر تحديث" },
  "Save Changes": { en: "Save Changes", so: "Xafid Isbedelada", ar: "حفظ التغييرات" },

  // Dashboard Page
  "Dashboard Overview": { en: "Dashboard Overview", so: "Dulmarka Dashboard-ka", ar: "نظرة عامة على لوحة القيادة" },
  "Welcome to Waqooyi Bari National ID Management System": { en: "Welcome to Waqooyi Bari National ID Management System", so: "Ku soo dhawow Nidaamka Aqoonsiga Qaranka", ar: "مرحبًا بك في نظام الهوية" },
  "Total Citizens": { en: "Total Citizens", so: "Wadarta Muwaadiniinta", ar: "إجمالي المواطنين" },
  "Total ID Cards": { en: "Total ID Cards", so: "Wadarta Kaadhadhka", ar: "إجمالي البطاقات" },
  "Pending Applications": { en: "Pending Applications", so: "Codsiyada Sugaya", ar: "الطلبات المعلقة" },
  "Approved": { en: "Approved", so: "La Ansixiyay", ar: "موافق عليه" },
  "Today's Registrations": { en: "Today's Registrations", so: "Diiwaangelinta Maanta", ar: "تسجيلات اليوم" },
  "Registration Trends": { en: "Registration Trends", so: "Isbedelada Diiwaangelinta", ar: "اتجاهات التسجيل" },
  "Gender Distribution": { en: "Gender Distribution", so: "Qaybinta Jinsiga", ar: "توزيع الجنس" },
  "Citizens by District": { en: "Citizens by District", so: "Muwaadiniinta Degmooyinka", ar: "المواطنون حسب المنطقة" },
  "Recent Registrations": { en: "Recent Registrations", so: "Diiwaangelintii Ugu Dambeysay", ar: "التسجيلات الحديثة" },
  "View All": { en: "View All", so: "Arag Dhammaan", ar: "عرض الكل" },

  // Register Citizen
  "Citizen Registration Form": { en: "Citizen Registration Form", so: "Foomka Diiwaangelinta", ar: "نموذج تسجيل المواطن" },
  "Personal Information": { en: "Personal Information", so: "Xogta Shakhsiga ah", ar: "معلومات شخصية" },
  "Full Name *": { en: "Full Name *", so: "Magaca Buuxa *", ar: "الاسم الكامل *" },
  "Father Name *": { en: "Father Name *", so: "Magaca Aabaha *", ar: "اسم الأب *" },
  "Mother Name *": { en: "Mother Name *", so: "Magaca Hooyada *", ar: "اسم الأم *" },
  "Date of Birth *": { en: "Date of Birth *", so: "Taariikhda Dhalashada *", ar: "تاريخ الميلاد *" },
  "Place of Birth *": { en: "Place of Birth *", so: "Meesha Dhalashada *", ar: "مكان الميلاد *" },
  "Gender": { en: "Gender", so: "Jinsiga", ar: "الجنس" },
  "Male": { en: "Male", so: "Lab", ar: "ذكر" },
  "Female": { en: "Female", so: "Dhedig", ar: "أنثى" },
  "Marital Status": { en: "Marital Status", so: "Xaaladda Guurka", ar: "الحالة الاجتماعية" },
  "Single": { en: "Single", so: "Doob/Gashaanti", ar: "أعزب" },
  "Married": { en: "Married", so: "Xaali", ar: "متزوج" },
  "Divorced": { en: "Divorced", so: "La Furay", ar: "مطلق" },
  "Widowed": { en: "Widowed", so: "Garoob/Laga Dhintay", ar: "أرمل" },
  "Phone Number *": { en: "Phone Number *", so: "Lambarka Taleefanka *", ar: "رقم الهاتف *" },
  "Occupation *": { en: "Occupation *", so: "Shaqada *", ar: "المهنة *" },
  "Status": { en: "Status", so: "Xaaladda", ar: "الحالة" },
  "Active": { en: "Active", so: "Firfircoon", ar: "نشط" },
  "Pending": { en: "Pending", so: "Sugaya", ar: "قيد الانتظار" },
  "Rejected": { en: "Rejected", so: "La Diiday", ar: "مرفوض" },
  "District": { en: "District", so: "Degmada", ar: "المنطقة" },
  "Address Details": { en: "Address Details", so: "Faahfaahinta Cinwaanka", ar: "تفاصيل العنوان" },
  "Full Address *": { en: "Full Address *", so: "Cinwaanka Buuxa *", ar: "العنوان الكامل *" },
  "Photo": { en: "Photo", so: "Sawirka", ar: "صورة" },
  "Citizen Photo": { en: "Citizen Photo", so: "Sawirka Muwaadinka", ar: "صورة المواطن" },
  "Reset": { en: "Reset", so: "Tirtir", ar: "إعادة تعيين" },
  "Save & Generate National ID": { en: "Save & Generate National ID", so: "Xafid & Samee Kaadhka", ar: "حفظ وإنشاء هوية وطنية" },
  
  // Public Verify
  "Waqooyi Bari · Identity Verification": { en: "Waqooyi Bari · Identity Verification", so: "Waqooyi Bari · Xaqiijinta Aqoonsiga", ar: "التحقق من الهوية" },
  "Powered by Siyaad National ID System": { en: "Powered by Siyaad National ID System", so: "Waxaa hirgeliyay Nidaamka Aqoonsiga Qaranka", ar: "بدعم من نظام الهوية الوطنية" },
  "Verifying identity…": { en: "Verifying identity…", so: "Waa la xaqiijinayaa...", ar: "جاري التحقق من الهوية..." },
  "Identity Not Found": { en: "Identity Not Found", so: "Aqoonsi Lama Helin", ar: "لم يتم العثور على الهوية" },
  "No registered citizen matches National ID": { en: "No registered citizen matches National ID", so: "Ma jiro muwaadin diiwaangashan oo leh Aqoonsigan", ar: "لا يوجد مواطن مسجل يطابق الهوية الوطنية" },
  "This QR code may be invalid or the record has been removed.": { en: "This QR code may be invalid or the record has been removed.", so: "Lambar sirta QR-ka wuu khaldanaan karaa ama xogtii waa la tirtiray.", ar: "قد يكون رمز الاستجابة السريعة غير صالح أو تمت إزالة السجل." },
  "VERIFIED — ACTIVE CITIZEN": { en: "VERIFIED — ACTIVE CITIZEN", so: "WAA LA XAQIIJIYAY — MUWAADIN FIRFIRCOON", ar: "تم التحقق - مواطن نشط" },
  "VERIFIED —": { en: "VERIFIED —", so: "WAA LA XAQIIJIYAY —", ar: "تم التحقق —" },
  "ACTIVE": { en: "ACTIVE", so: "FIRFIRCOON", ar: "نشط" },
  "PENDING": { en: "PENDING", so: "SUGAYA", ar: "قيد الانتظار" },
  "REJECTED": { en: "REJECTED", so: "LA DIIDAY", ar: "مرفوض" },
  "ID Valid Until": { en: "ID Valid Until", so: "Kaadhku Wuxuu Dhacayaa", ar: "صالحة حتى" },
  "Issue Date": { en: "Issue Date", so: "Taariikhda Bixinta", ar: "تاريخ الإصدار" },
  "Verified on": { en: "Verified on", so: "La xaqiijiyay", ar: "تم التحقق في" },
  "Phone Number": { en: "Phone Number", so: "Taleefanka", ar: "رقم الهاتف" },
  "Occupation": { en: "Occupation", so: "Shaqada", ar: "المهنة" },
  
  // Citizens List
  "citizens found": { en: "citizens found", so: "muwaadin la helay", ar: "مواطن تم العثور عليه" },
  "Export CSV": { en: "Export CSV", so: "Dhoofi CSV", ar: "تصدير CSV" },
  "Register New": { en: "Register New", so: "Diiwaangeli Cusub", ar: "تسجيل جديد" },
  "Search by name, ID, phone, district…": { en: "Search by name, ID, phone, district…", so: "Ku raadi magac, ID, taleefan, degmo…", ar: "ابحث بالاسم، الهوية، الهاتف..." },
  "Citizen Details": { en: "Citizen Details", so: "Xogta Muwaadinka", ar: "تفاصيل المواطن" },
  "National ID": { en: "National ID", so: "Aqoonsiga Qaranka", ar: "الهوية الوطنية" },
  "Contact & Location": { en: "Contact & Location", so: "Xidhiidhka & Goobta", ar: "الاتصال والموقع" },
  "Registered": { en: "Registered", so: "La Diiwaangeliyay", ar: "مسجل" },
  "Actions": { en: "Actions", so: "Tallaabooyinka", ar: "الإجراءات" }
};

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('app-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('app-language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const t = (key: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a I18nProvider');
  }
  return context;
}
