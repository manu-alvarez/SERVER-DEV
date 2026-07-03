import type { ReactNode } from 'react';

interface BentoGridProps {
  children: ReactNode;
  className?: string;
}

export const BentoGrid = ({ children, className = '' }: BentoGridProps) => {
  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-[250px] ${className}`}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className = '',
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | ReactNode;
  description?: string | ReactNode;
  header?: ReactNode;
  icon?: ReactNode;
}) => {
  return (
    <div
      className={`row-span-1 rounded-2xl group/bento hover:shadow-xl transition duration-200 shadow-input dark:shadow-none p-4 dark:bg-black/40 bg-white border border-transparent justify-between flex flex-col space-y-4 ${className}`}
    >
      {header}
      <div className="group-hover/bento:translate-x-2 transition duration-200">
        {icon}
        <div className="font-bold text-neutral-600 dark:text-neutral-200 mb-2 mt-2">
          {title}
        </div>
        <div className="font-normal text-neutral-600 dark:text-neutral-300 text-xs">
          {description}
        </div>
      </div>
    </div>
  );
};
