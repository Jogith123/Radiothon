/**
 * PhoneSimulator — flat phone UI, no animations, no gradients
 */

import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Delete, Signal, Battery, GraduationCap } from 'lucide-react';

const PhoneSimulator = () => {
    const [activeCall, setActiveCall] = useState(false);
    const [dialedNumber, setDialedNumber] = useState('');
    const [callDuration, setCallDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [callStatus, setCallStatus] = useState('Ready');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        let interval;
        if (activeCall && callStatus === 'Connected') {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [activeCall, callStatus]);

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const handleCall = async () => {
        if (!activeCall) {
            if (dialedNumber.length === 0) return;
            setActiveCall(true);
            setCallStatus('Calling...');
            setTimeout(() => setCallStatus('Connected'), 1500);
        } else {
            setCallStatus('Ending...');
            setTimeout(() => {
                setActiveCall(false);
                setCallDuration(0);
                setDialedNumber('');
                setCallStatus('Ready');
            }, 1000);
        }
    };

    const handleDigit = async (digit) => {
        if (!activeCall) {
            setDialedNumber(prev => (prev + digit).slice(0, 15));
        } else {
            console.log(`DTMF: ${digit}`);
        }
    };

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

    return (
        <div className="w-[320px] h-[600px] bg-[#0F172A] rounded-[40px] border-4 border-[#1E293B] relative overflow-hidden flex flex-col mx-auto">
            {/* Status Bar */}
            <div className="h-6 w-full flex justify-between items-center px-6 pt-3 text-white text-[10px] font-medium z-10">
                <span aria-label="Current time">{currentTime}</span>
                <div className="flex gap-2 items-center" aria-label="Phone status">
                    <Signal size={12} aria-hidden="true" />
                    <Battery size={12} aria-hidden="true" />
                </div>
            </div>

            {/* Screen Content */}
            <div className="flex-1 flex flex-col relative z-0">
                {!activeCall ? (
                    <div className="flex-1 flex flex-col p-6">
                        <div className="flex-1 flex flex-col justify-end items-center mb-8">
                            <span className="text-3xl text-white font-light tracking-wider h-10" aria-live="polite">
                                {dialedNumber || '\u00A0'}
                            </span>
                            {dialedNumber && (
                                <button
                                    onClick={() => setDialedNumber(prev => prev.slice(0, -1))}
                                    className="text-slate-400 mt-2 p-2 hover:text-white transition-colors"
                                    aria-label="Delete last digit"
                                >
                                    <Delete size={20} />
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-y-6 gap-x-4 mb-8" role="group" aria-label="Phone keypad">
                            {keys.map(key => (
                                <button
                                    key={key}
                                    onClick={() => handleDigit(key)}
                                    aria-label={`Dial ${key}`}
                                    className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 active:bg-white/30 flex items-center justify-center text-white text-2xl font-medium transition-colors mx-auto"
                                >
                                    {key}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-center pb-8">
                            <button
                                onClick={handleCall}
                                disabled={dialedNumber.length === 0}
                                aria-label="Start call"
                                className="w-16 h-16 rounded-full bg-[#15803D] hover:bg-[#166534] disabled:bg-slate-700 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
                            >
                                <Phone size={28} fill="currentColor" />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center pt-16 bg-[#0F172A]">
                        <div className="w-24 h-24 rounded-full bg-[#1E293B] flex items-center justify-center mb-4" aria-hidden="true">
                            <GraduationCap size={48} className="text-slate-300" />
                        </div>
                        <h3 className="text-white text-xl font-medium mb-1">VidyaVani AI</h3>
                        <p className="text-slate-400 text-sm mb-2" aria-live="polite">{callStatus}</p>
                        <p className="text-white text-lg font-mono" aria-label={`Call duration: ${formatDuration(callDuration)}`}>
                            {formatDuration(callDuration)}
                        </p>

                        {/* Static bars (no animation) */}
                        <div className="flex-1 w-full flex items-center justify-center gap-1.5 px-8" aria-hidden="true">
                            {[12, 20, 28, 36, 40, 36, 28, 20].map((h, i) => (
                                <div
                                    key={i}
                                    className="w-1 bg-slate-500 rounded-full"
                                    style={{ height: `${h}px` }}
                                />
                            ))}
                        </div>

                        {/* Controls */}
                        <div className="w-full bg-[#1E293B] rounded-t-[30px] p-8 pb-12">
                            <div className="grid grid-cols-3 gap-6 mb-8" role="group" aria-label="Call controls">
                                <button
                                    onClick={() => setIsMuted(!isMuted)}
                                    aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                                    aria-pressed={isMuted}
                                    className={`flex flex-col items-center gap-1 ${isMuted ? 'text-white' : 'text-slate-400'}`}
                                >
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-white text-[#0F172A]' : 'border border-slate-600'}`}>
                                        {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                                    </div>
                                    <span className="text-[10px]">Mute</span>
                                </button>
                                <button
                                    onClick={() => console.log('Keypad toggle')}
                                    aria-label="Toggle keypad"
                                    className="flex flex-col items-center gap-1 text-slate-400"
                                >
                                    <div className="w-14 h-14 rounded-full border border-slate-600 flex items-center justify-center">
                                        <div className="grid grid-cols-3 gap-1 w-6">
                                            {[...Array(9)].map((_, i) => <div key={i} className="w-1 h-1 bg-current rounded-full" />)}
                                        </div>
                                    </div>
                                    <span className="text-[10px]">Keypad</span>
                                </button>
                                <button
                                    onClick={() => setIsSpeaker(!isSpeaker)}
                                    aria-label={isSpeaker ? 'Disable speaker' : 'Enable speaker'}
                                    aria-pressed={isSpeaker}
                                    className={`flex flex-col items-center gap-1 ${isSpeaker ? 'text-white' : 'text-slate-400'}`}
                                >
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isSpeaker ? 'bg-white text-[#0F172A]' : 'border border-slate-600'}`}>
                                        {isSpeaker ? <Volume2 size={24} /> : <VolumeX size={24} />}
                                    </div>
                                    <span className="text-[10px]">Speaker</span>
                                </button>
                            </div>

                            <div className="flex justify-center">
                                <button
                                    onClick={handleCall}
                                    aria-label="End call"
                                    className="w-16 h-16 rounded-full bg-[#B91C1C] hover:bg-[#991B1B] flex items-center justify-center text-white transition-colors"
                                >
                                    <PhoneOff size={28} fill="currentColor" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhoneSimulator;

