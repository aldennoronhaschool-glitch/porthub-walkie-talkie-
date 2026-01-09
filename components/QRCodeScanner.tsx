"use client";

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera } from 'lucide-react';

interface QRCodeScannerProps {
    onScan: (decodedText: string) => void;
    onClose: () => void;
}

export function QRCodeScanner({ onScan, onClose }: QRCodeScannerProps) {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const startScanner = async () => {
            try {
                const scanner = new Html5Qrcode("qr-reader");
                scannerRef.current = scanner;

                await scanner.start(
                    { facingMode: "environment" },
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 }
                    },
                    (decodedText) => {
                        scanner.stop().then(() => {
                            onScan(decodedText);
                        });
                    },
                    (errorMessage) => {
                        // Ignore scan errors, they happen frequently
                    }
                );

                setIsScanning(true);
            } catch (err: any) {
                console.error("Scanner error:", err);
                setError(err.message || "Failed to start camera");
            }
        };

        startScanner();

        return () => {
            if (scannerRef.current && isScanning) {
                scannerRef.current.stop().catch(console.error);
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[200] bg-black flex flex-col">
            {/* Header */}
            <div className="p-6 pt-12 flex justify-between items-center">
                <h2 className="text-white font-black text-xl">Scan QR Code</h2>
                <button 
                    onClick={() => {
                        if (scannerRef.current && isScanning) {
                            scannerRef.current.stop().then(() => onClose());
                        } else {
                            onClose();
                        }
                    }}
                    className="p-2 bg-zinc-900 rounded-full text-white"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>

            {/* Scanner Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6">
                {error ? (
                    <div className="text-center">
                        <Camera className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <p className="text-red-500 font-bold mb-2">Camera Error</p>
                        <p className="text-zinc-500 text-sm">{error}</p>
                    </div>
                ) : (
                    <>
                        <div id="qr-reader" className="w-full max-w-md rounded-3xl overflow-hidden border-4 border-indigo-500 shadow-2xl shadow-indigo-500/50"></div>
                        <p className="text-zinc-500 text-sm mt-6 text-center">
                            Position the QR code within the frame
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
