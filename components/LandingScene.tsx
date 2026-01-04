'use client';

import Spline from '@splinetool/react-spline';

export default function LandingScene() {
    return (
        <div className="absolute inset-0 z-0">
            <Spline
                scene="https://prod.spline.design/4a26cc6d-4f0a-4af9-9b2d-c8e18d48cc0a/scene.splinecode"
                className="w-full h-full"
            />
            {/* Fallback overlay (optional, but Spline usually handles loading) */}
            <div className="absolute inset-0 bg-black -z-10" />
        </div>
    );
}
