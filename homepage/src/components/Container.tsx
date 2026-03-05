import { ReactNode } from 'react';

interface ContainerProps {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'large';
}

export default function Container({ children, className = '', size = 'default' }: ContainerProps) {
  const maxWidth = size === 'large' ? 'max-w-4xl' : 'max-w-3xl';
  
  return (
    <div className={`mx-auto px-4 sm:px-6 lg:px-8 ${maxWidth} ${className}`}>
      {children}
    </div>
  );
}