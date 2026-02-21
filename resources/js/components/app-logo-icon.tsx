import type { SVGAttributes } from 'react';

export default function AppLogoIcon(props: SVGAttributes<SVGElement>) {
    return (
        <svg {...props} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Power button symbol matching the logo */}
            <circle cx="12" cy="12" r="8" fill="none" stroke="#5eb3e6" strokeWidth="3"/>
            <line x1="12" y1="2" x2="12" y2="8" stroke="#5eb3e6" strokeWidth="3" strokeLinecap="round"/>
        </svg>
    );
}
