'use client';

// import Spline from '@splinetool/react-spline';

export default function LandingScene() {
    return (
        <div className="absolute inset-0 z-0 bg-black">
            {/* Fallback Background while Spline is misconfigured or server not restarted */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-900 to-black"></div>

            {/* Abstract Mesh Pattern */}
            <div className="absolute inset-0 opacity-30" style={{
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)',
                backgroundSize: '40px 40px'
            }}></div>

            {/* 3D Scene (Disabled to fix 'Data read error') */}
            {/* To re-enable: 
                1. Ensure valid Public Spline URL (ending in .splinecode)
                2. Restart 'npm run dev' terminal 
            */}
            {/* 
            <Spline 
                scene="https://prod.spline.design/4a26cc6d-4f0a-4af9-9b2d-c8e18d48cc0a/scene.splinecode" 
                className="w-full h-full"
            />
            */}
        </div>
    );
}
