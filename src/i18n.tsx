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
  "Users": { en: "Users", so: "Isticmaalayaasha", ar: "المستخدمون" },
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
  "Citizen Details": { en: "Citizen Details", so: "Xogta Muwaadinka", ar: "تفاصيل المواطن" },
  
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
  "✓ Autosaved": { en: "✓ Autosaved", so: "✓ La Keydsaday", ar: "✓ تم الحفظ تلقائياً" },
  "Auto-saving is ON": { en: "Auto-saving is ON", so: "Keydsinta Toos ah waa Shidan", ar: "الحفظ التلقائي مفعّل" },

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

  // Citizens List
  "citizens found": { en: "citizens found", so: "muwaadiin la helay", ar: "مواطن تم العثور عليه" },
  "Export CSV": { en: "Export CSV", so: "Dhooji CSV", ar: "تصدير CSV" },
  "Register New": { en: "Register New", so: "Diiwaangeli Cusub", ar: "تسجيل جديد" },
  "Search by name, ID, phone, district…": { en: "Search by name, ID, phone, district…", so: "Raadi magac, ID, tel, degmo…", ar: "البحث باسم، هوية، هاتف، منطقة…" },
  "All Statuses": { en: "All Statuses", so: "Dhammaan Xaaladaha", ar: "جميع الحالات" },
  "Advanced Filters": { en: "Advanced Filters", so: "Shaandhaynta Horumarsan", ar: "تصفية متقدمة" },
  "Clear All": { en: "Clear All", so: "Nadiifi Dhammaan", ar: "مسح الكل" },
  "Rows per page:": { en: "Rows per page:", so: "Safaf bogga:", ar: "صفوف لكل صفحة:" },
  "Photo": { en: "Photo", so: "Sawirka", ar: "صورة" },
  "National ID": { en: "National ID", so: "ID Qaranka", ar: "الهوية الوطنية" },
  "Contact & Location": { en: "Contact & Location", so: "Xiriir & Goob", ar: "التواصل والموقع" },
  "Status": { en: "Status", so: "Xaaladda", ar: "الحالة" },
  "Registered": { en: "Registered", so: "La Diiwaangeliyay", ar: "مسجّل" },
  "Actions": { en: "Actions", so: "Ficilada", ar: "الإجراءات" },
  "Loading citizens...": { en: "Loading citizens...", so: "Waa la raraysaa...", ar: "جاري التحميل..." },
  "No citizens found": { en: "No citizens found", so: "Muwaadiin lama helin", ar: "لم يُعثر على مواطنين" },
  "Try adjusting your search or filters.": { en: "Try adjusting your search or filters.", so: "Isku day in aad bedelto raadinta.", ar: "حاول تعديل البحث أو التصفية." },
  "Showing": { en: "Showing", so: "Muujinaya", ar: "يعرض" },
  "to": { en: "to", so: "ilaa", ar: "إلى" },
  "of": { en: "of", so: "ka", ar: "من" },
  "entries": { en: "entries", so: "gal", ar: "إدخال" },
  "Previous": { en: "Previous", so: "Hore", ar: "السابق" },
  "Next": { en: "Next", so: "Xiga", ar: "التالي" },
  "Page": { en: "Page", so: "Bogga", ar: "صفحة" },
  "Confirm Deletion": { en: "Confirm Deletion", so: "Xaqiiji Tirtiridda", ar: "تأكيد الحذف" },
  "Are you sure you want to delete this citizen record?": { en: "Are you sure you want to delete this citizen record?", so: "Ma hubtaa inaad tirtireyso xogtan?", ar: "هل أنت متأكد أنك تريد حذف هذا السجل؟" },
  "Cancel": { en: "Cancel", so: "Jooji", ar: "إلغاء" },
  "Delete Citizen": { en: "Delete Citizen", so: "Tirtir Muwaadinka", ar: "حذف المواطن" },

  // Register Citizen
  "Citizen Registration": { en: "Citizen Registration", so: "Diiwaangelinta Muwaadinka", ar: "تسجيل المواطن" },
  "Registration Form": { en: "Registration Form", so: "Foomka Diiwaangelinta", ar: "نموذج التسجيل" },
  "Data Preview": { en: "Data Preview", so: "Dib u Fiiri Xogta", ar: "معاينة البيانات" },
  "Citizen Registration Form": { en: "Citizen Registration Form", so: "Foomka Diiwaangelinta", ar: "نموذج تسجيل المواطن" },
  "Personal Information": { en: "Personal Information", so: "Xogta Shakhsiga ah", ar: "معلومات شخصية" },
  "Full Name": { en: "Full Name", so: "Magaca Buuxa", ar: "الاسم الكامل" },
  "Father Name": { en: "Father Name", so: "Magaca Aabaha", ar: "اسم الأب" },
  "Mother Name": { en: "Mother Name", so: "Magaca Hooyada", ar: "اسم الأم" },
  "Full Name *": { en: "Full Name *", so: "Magaca Buuxa *", ar: "الاسم الكامل *" },
  "Father Name *": { en: "Father Name *", so: "Magaca Aabaha *", ar: "اسم الأب *" },
  "Mother Name *": { en: "Mother Name *", so: "Magaca Hooyada *", ar: "اسم الأم *" },
  "Date of Birth": { en: "Date of Birth", so: "Taariikhda Dhalashada", ar: "تاريخ الميلاد" },
  "Date of Birth *": { en: "Date of Birth *", so: "Taariikhda Dhalashada *", ar: "تاريخ الميلاد *" },
  "Place of Birth": { en: "Place of Birth", so: "Meesha Dhalashada", ar: "مكان الميلاد" },
  "Place of Birth *": { en: "Place of Birth *", so: "Meesha Dhalashada *", ar: "مكان الميلاد *" },
  "Gender": { en: "Gender", so: "Jinsiga", ar: "الجنس" },
  "Male": { en: "Male", so: "Lab", ar: "ذكر" },
  "Female": { en: "Female", so: "Dhedig", ar: "أنثى" },
  "Marital Status": { en: "Marital Status", so: "Xaaladda Guurka", ar: "الحالة الاجتماعية" },
  "Single": { en: "Single", so: "Doob/Gashaanti", ar: "أعزب" },
  "Married": { en: "Married", so: "Xaali", ar: "متزوج" },
  "Divorced": { en: "Divorced", so: "La Furay", ar: "مطلق" },
  "Widowed": { en: "Widowed", so: "Garoob/Laga Dhintay", ar: "أرمل" },
  "Phone Number": { en: "Phone Number", so: "Lambarka Taleefanka", ar: "رقم الهاتف" },
  "Phone Number *": { en: "Phone Number *", so: "Lambarka Taleefanka *", ar: "رقم الهاتف *" },
  "Phone": { en: "Phone", so: "Taleefanka", ar: "الهاتف" },
  "Occupation": { en: "Occupation", so: "Shaqada", ar: "المهنة" },
  "Occupation *": { en: "Occupation *", so: "Shaqada *", ar: "المهنة *" },
  "Registration Status": { en: "Registration Status", so: "Xaaladda Diiwaangelinta", ar: "حالة التسجيل" },
  "Active": { en: "Active", so: "Firfircoon", ar: "نشط" },
  "Pending": { en: "Pending", so: "Sugaya", ar: "قيد الانتظار" },
  "Rejected": { en: "Rejected", so: "La Diiday", ar: "مرفوض" },
  "District": { en: "District", so: "Degmada", ar: "المنطقة" },
  "Address": { en: "Address", so: "Cinwaanka", ar: "العنوان" },
  "Full Address": { en: "Full Address", so: "Cinwaanka Buuxa", ar: "العنوان الكامل" },
  "Address Details": { en: "Address Details", so: "Faahfaahinta Cinwaanka", ar: "تفاصيل العنوان" },
  "Full Address *": { en: "Full Address *", so: "Cinwaanka Buuxa *", ar: "العنوان الكامل *" },
  "Citizen Photo": { en: "Citizen Photo", so: "Sawirka Muwaadinka", ar: "صورة المواطن" },
  "Clear Form": { en: "Clear Form", so: "Nadiifi Foomka", ar: "مسح النموذج" },
  "Reset": { en: "Reset", so: "Tirtir", ar: "إعادة تعيين" },
  "Save & Generate National ID": { en: "Save & Generate National ID", so: "Xafid & Samee Kaadhka", ar: "حفظ وإنشاء هوية وطنية" }
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
