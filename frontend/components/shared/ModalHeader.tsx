import React from 'react';

interface ModalHeaderProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBgClass?: string;
  iconColorClass?: string;
}

export const ModalHeader: React.FC<ModalHeaderProps> = ({
  icon,
  title,
  description,
  iconBgClass = 'bg-blue-50',
  iconColorClass = 'text-blue-500'
}) => {
  return (
    <div className="flex flex-col items-center text-center mb-6">
      <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${iconBgClass}`}>
        <div className={iconColorClass}>
          {icon}
        </div>
      </div>
      <h4 className="font-accent text-lg text-vintage-crimsonLight transform -rotate-1 mb-1">
        one more thing!
      </h4>
      <h2 className="text-3xl font-display font-black text-vintage-crimson tracking-tighter">
        {title}
      </h2>
      <p className="font-mono text-vintage-ink/60 text-sm mt-3 leading-relaxed">
        {description}
      </p>
    </div>
  );
};
