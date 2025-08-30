import { useNavigate } from 'react-router-dom';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function AuthHeader() {
    const navigate = useNavigate();

    return (
        <div className="relative z-20 p-6">
            <div className="flex items-center justify-start">
                <Button
                    variant="ghost"
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 hover:bg-white/10 transition-all duration-300 rounded-xl px-3 py-2"
                >
                    <img 
                      src="/logo.png" 
                      alt="Reviewoly Logo" 
                      className="w-8 h-8 object-contain"
                    />
                    <span className="text-2xl font-bold text-white">
                        Review<span className="text-accent">oly</span>
                    </span>
                </Button>
            </div>
        </div>
    );
}