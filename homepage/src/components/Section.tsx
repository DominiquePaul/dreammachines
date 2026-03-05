import { ReactNode } from 'react';
import Container from './Container';

interface SectionProps {
  children: ReactNode;
  className?: string;
  containerSize?: 'default' | 'large';
}

export default function Section({ children, className = '', containerSize = 'default' }: SectionProps) {
  return (
    <section className={`py-16 md:py-24 ${className}`}>
      <Container size={containerSize}>
        {children}
      </Container>
    </section>
  );
}