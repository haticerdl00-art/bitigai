import React from 'react';
import { motion } from 'motion/react';

interface EmptyStateProps {
  icon: string | React.ReactNode;
  title: string;
  description: string;
  ctaText: string;
  ctaAction: () => void;
  ctaSecondaryText?: string;
  ctaSecondaryAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  ctaText,
  ctaAction,
  ctaSecondaryText,
  ctaSecondaryAction,
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-md mx-auto h-full min-h-[400px]"
    >
      <div className="text-6xl mb-2">
        {typeof icon === 'string' ? (
          <span role="img" aria-label="icon">{icon}</span>
        ) : (
          icon
        )}
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-bold text-slate-800">{title}</h3>
        <p className="text-slate-500 text-sm leading-relaxed">
          {description}
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
        <button
          onClick={ctaAction}
          className="w-full sm:w-auto px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
        >
          {ctaText}
        </button>
        
        {ctaSecondaryText && ctaSecondaryAction && (
          <button
            onClick={ctaSecondaryAction}
            className="w-full sm:w-auto px-8 py-3 text-slate-500 font-bold rounded-xl hover:bg-slate-100 transition-all active:scale-95"
          >
            {ctaSecondaryText}
          </button>
        )}
      </div>
    </motion.div>
  );
};

// --- KULLANIM ÖRNEKLERİ ---

export const FinansalDurumEmptyState = () => (
  <EmptyState
    icon="📊"
    title="Henüz mizan yüklenmedi"
    description="6 aylık nakit projeksiyonu için mizan dosyanızı yükleyin"
    ctaText="Mizan Yükle"
    ctaAction={() => console.log('Mizan Yükle tıklandı')}
  />
);

export const OfisVerimlilikEmptyState = () => (
  <EmptyState
    icon="🔍"
    title="Denetim başlatmak için mizan gerekli"
    description="Mizan yükleyin; teknik hatalar ve rasyolar otomatik analiz edilsin"
    ctaText="Mizan Yükle"
    ctaAction={() => console.log('Mizan Yükle tıklandı')}
  />
);

export const BelgeEvrakEmptyState = () => (
  <EmptyState
    icon="📁"
    title="Henüz belge eklenmedi"
    description="Müşterilerinize ait resmi belgeleri buraya yükleyin ve takip edin"
    ctaText="İlk Belgeyi Yükle"
    ctaAction={() => console.log('İlk Belgeyi Yükle tıklandı')}
  />
);

export const SGKTesvikEmptyState = () => (
  <EmptyState
    icon="⚡"
    title="Teşvik analizi için firma profili gerekli"
    description="Personel bilgilerini girin; AI hangi teşviklerden yararlanabileceğinizi hesaplasın"
    ctaText="Profili Tamamla"
    ctaSecondaryText="Sonra Tamamlarım"
    ctaAction={() => console.log('Profili Tamamla tıklandı')}
    ctaSecondaryAction={() => console.log('Sonra Tamamlarım tıklandı')}
  />
);

export const MaliyetUretimEmptyState = () => (
  <EmptyState
    icon="🏭"
    title="Ürün reçetesi bulunamadı"
    description="Birim maliyet analizi için ilk ürününüzü ve reçetesini ekleyin"
    ctaText="Ürün Ekle"
    ctaAction={() => console.log('Ürün Ekle tıklandı')}
  />
);
