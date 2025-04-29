import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { RegistrationShort } from '../../types/entities';
import Button from '../Common/Button';

interface MyEventCardProps {
    registration: RegistrationShort;
    onUnregister: (eventId: number) => void; // eventId из registration.event не доступен в RegistrationShort, нужно будет добавить в тип или передавать отдельно
    isUnregistering: boolean;
    eventId: number; // Передаем ID события отдельно
}

const MyEventCard: React.FC<MyEventCardProps> = ({ registration, onUnregister, isUnregistering, eventId }) => {
    const formattedDate = format(new Date(registration.event_dt_start), 'd MMMM yyyy, HH:mm', { locale: ru });
    const isPast = new Date(registration.event_dt_start) < new Date();

    return (
        <div className="bg-white shadow-md rounded-lg overflow-hidden p-4 border border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
                {/* QR Code */}
                {!isPast && registration.qr_code_data && (
                     <div className="flex-shrink-0 text-center md:text-left">
                         <div className="p-2 bg-white inline-block border rounded">
                             <QRCodeSVG
                                 value={registration.qr_code_data} // UUID регистрации
                                 size={128}
                                 level={"M"}
                                 includeMargin={false}
                             />
                         </div>
                         <p className="text-xs text-gray-500 mt-1">Ваш QR для входа</p>
                     </div>
                 )}
                 {isPast && (
                    <div className="flex-shrink-0 text-center md:text-left p-4 bg-gray-100 rounded border text-gray-500">
                        Мероприятие <br/> завершилось
                    </div>
                 )}

                {/* Event Info */}
                <div className="flex-grow">
                    <h3 className="text-lg font-semibold text-indigo-700 mb-1">
                        {registration.event_title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-1">{formattedDate}</p>
                    <p className="text-sm text-gray-600 mb-2">{registration.event_location}</p>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                        {registration.attended ? (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                 {/* Heroicon: check-circle */}
                                 <svg className="-ml-0.5 mr-1.5 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                 Посещено
                             </span>
                        ) : isPast ? (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                 Завершено (не посещено)
                             </span>
                        ) : (
                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                 Зарегистрированы
                             </span>
                        )}
                    </div>
                     {/* Кнопка отмены регистрации (только для будущих) */}
                     {!isPast && !registration.attended && (
                         <div className="mt-3">
                              <Button
                                 variant='danger'
                                 size='sm'
                                 onClick={() => onUnregister(eventId)}
                                 isLoading={isUnregistering}
                                 disabled={isUnregistering}
                                >
                                 Отменить регистрацию
                             </Button>
                         </div>
                     )}
                </div>
            </div>
        </div>
    );
};

export default MyEventCard;