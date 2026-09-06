import {Hand,Eye,Scissors,Sparkles,Flower2} from 'lucide-react';
export function ServiceIcon({category}:{category:string}){const Icon=category==='nails'?Hand:category==='lashes'?Eye:category==='hair'?Scissors:category==='makeup'?Sparkles:Flower2;return <Icon size={20} strokeWidth={1.5}/>;}
