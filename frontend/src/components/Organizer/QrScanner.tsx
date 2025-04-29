import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeResult, QrcodeErrorCallback, QrcodeSuccessCallback } from 'html5-qrcode';
import LoadingSpinner from '../Common/LoadingSpinner';
import Button from '../Common/Button';

interface QrScannerProps {
    onScanSuccess: (decodedText: string, decodedResult: Html5QrcodeResult) => void;
    onScanFailure?: QrcodeErrorCallback;
    qrboxSize?: number;
    fps?: number;
}

const QR_READER_ELEMENT_ID = 'qr-reader-studafishka';

const QrScanner: React.FC<QrScannerProps> = ({
    onScanSuccess,
    onScanFailure = (error) => console.warn(`QR Scan Error: ${error}`),
    qrboxSize = 250,
    fps = 10,
}) => {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Показываем загрузку пока камера инициализируется
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    useEffect(() => {
        // Запрашиваем доступ к камере для проверки заранее
        Html5QrcodeScanner.getCameras().then(() => {
            setHasPermission(true);
            setIsLoading(false);
        }).catch(err => {
            console.error("Camera permission error:", err);
            setHasPermission(false);
            setIsLoading(false);
        });

        // Создаем и рендерим сканер только если есть разрешение
        if (hasPermission === true) {
            scannerRef.current = new Html5QrcodeScanner(
                QR_READER_ELEMENT_ID,
                {
                    fps: fps,
                    qrbox: { width: qrboxSize, height: qrboxSize },
                    // Улучшения для мобильных:
                    experimentalFeatures: {
                        useBarCodeDetectorIfSupported: true // Использовать нативный Barcode Detector API если доступен
                    },
                    rememberLastUsedCamera: true, // Запоминать последнюю камеру
                    supportedScanTypes: [], // Сканировать только QR
                },
                /* verbose= */ false
            );

            scannerRef.current.render(onScanSuccess, onScanFailure);
        }

        // Очистка при размонтировании
        return () => {
            if (scannerRef.current && scannerRef.current.getState() !== 1) { // 1 = NOT_STARTED
                scannerRef.current.clear().catch(error => {
                    console.error('Failed to clear html5QrcodeScanner.', error);
                });
                scannerRef.current = null;
            }
        };
        // Зависимости: пересоздаем сканер если колбеки или конфиг изменятся
    }, [onScanSuccess, onScanFailure, qrboxSize, fps, hasPermission]);

    if (isLoading) {
         return <LoadingSpinner message="Запрос доступа к камере..." />;
    }

    if (hasPermission === false) {
        return (
            <div className="p-4 text-center border border-red-300 bg-red-50 rounded text-red-700">
                <p className="font-semibold">Не удалось получить доступ к камере.</p>
                <p className="text-sm">Пожалуйста, проверьте разрешения для камеры в настройках браузера и перезагрузите страницу.</p>
             </div>
        );
    }

     // Сканер рендерится в этот div
    return <div id={QR_READER_ELEMENT_ID} className="w-full max-w-md mx-auto border rounded shadow-inner bg-gray-100 p-2" />;
};

export default QrScanner;