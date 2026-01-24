/**
 * PhoneSimulator Component
 * Interactive phone UI for making test calls to the VidyaVani AI system.
 */

import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Delete, Signal, Battery, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCallSession } from '../../hooks/api/useCallSession';

const PhoneSimulator = () => {
    const [activeCall, setActiveCall] = useState(false);
    const [dialedNumber, setDialedNumber] = useState('');
    const [callDuration, setCallDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState('');
    // TODO: isMuted and isSpeaker are visual indicators for now. 
    // In a real implementation, these would control audio streams via WebRTC or Twilio SDK.
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeaker, setIsSpeaker] = useState(false);
    const [callStatus, setCallStatus] = useState('Ready');

    const { startCall, endCall, sendDtmf } = useCallSession();

    // Update current time every second
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    // Call timer logic
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

            try {
                setTimeout(async () => {
                    setCallStatus('Connected');
                    try {
                        await startCall.mutateAsync(dialedNumber);
                    } catch (e) {
                        console.log('Mock: Backend call failed but proceeding in demo mode');
                    }
                }, 1500);
            } catch (err) {
                console.error('Call initiation error:', err);
                setCallStatus('Failed');
                setTimeout(() => setActiveCall(false), 2000);
            }
        } else {
            setCallStatus('Ending...');
            try { await endCall.mutateAsync(); } catch (e) { console.error('End call error:', e); }

            setCallStatus('Ended');
            setTimeout(() => {
                setActiveCall(false);
                setCallDuration(0);
                setDialedNumber('');
                setCallStatus('Ready');
            }, 1500);
        }
    };

    const handleDigit = async (digit) => {
        if (!activeCall) {
            setDialedNumber(prev => (prev + digit).slice(0, 15));
        } else {
            console.log(`DTMF: ${digit}`);
            try { await sendDtmf.mutateAsync(digit); } catch (e) { console.error('DTMF send error:', e); }
        }
    };

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

    return (
        <div className="w-[320px] h-[600px] bg-slate-900 rounded-[40px] border-8 border-slate-800 shadow-2xl relative overflow-hidden flex flex-col mx-auto">
            {/* Status Bar */}
            <div className="h-6 w-full bg-transparent flex justify-between items-center px-6 pt-3 text-white text-[10px] font-medium z-10">
                <span aria-label="Current time">{currentTime}</span>
                <div className="flex gap-2 items-center" aria-label="Phone status">
                    <Signal size={12} aria-hidden="true" />
                    <Battery size={12} aria-hidden="true" />
                </div>
            </div>

            {/* Screen Content */}
            <div className="flex-1 flex flex-col relative z-0">
                <AnimatePresence mode="wait">
                    {!activeCall ? (
                        <motion.div
                            key="dialer"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex-1 flex flex-col p-6"
                        >
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
                                    className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-400 disabled:bg-green-800 disabled:cursor-not-allowed flex items-center justify-center text-white shadow-lg shadow-green-500/30 transition-all transform hover:scale-105"
                                >
                                    <Phone size={28} fill="currentColor" />
                                </button>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="call-screen"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="flex-1 flex flex-col items-center pt-16 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900"
                        >
                            <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center mb-4" aria-hidden="true">
                                <GraduationCap size={48} className="text-primary-light" />
                            </div>
                            <h3 className="text-white text-xl font-medium mb-1">VidyaVani AI</h3>
                            <p className="text-slate-400 text-sm mb-2" aria-live="polite">{callStatus}</p>
                            <p className="text-white text-lg font-mono" aria-label={`Call duration: ${formatDuration(callDuration)}`}>
                                {formatDuration(callDuration)}
                            </p>

                            {/* Waveform Visualization */}
                            <div className="flex-1 w-full flex items-center justify-center gap-1 px-8" aria-hidden="true">
                                {[1, 2, 3, 4, 5, 4, 3, 2].map((h, i) => (
                                    <motion.div
                                        key={i}
                                        className="w-1 bg-primary-light rounded-full"
                                        animate={{ height: [10, h * 8, 10] }}
                                        transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.1 }}
                                        style={{ backgroundColor: 'var(--color-secondary)' }}
                                    />
                                ))}
                            </div>

                            {/* Controls */}
                            <div className="w-full bg-slate-800/80 backdrop-blur-md rounded-t-[30px] p-8 pb-12">
                                <div className="grid grid-cols-3 gap-6 mb-8" role="group" aria-label="Call controls">
                                    <button
                                        onClick={() => setIsMuted(!isMuted)}
                                        aria-label={isMuted ? 'Unmute microphone' : 'Mute microphone'}
                                        aria-pressed={isMuted}
                                        className={`flex flex-col items-center gap-1 ${isMuted ? 'text-white' : 'text-slate-400'}`}
                                    >
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isMuted ? 'bg-white text-slate-900' : 'bg-transparent border border-slate-600'}`}>
                                            {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
                                        </div>
                                        <span className="text-[10px]">Mute</span>
                                    </button>
                                    <button
                                        onClick={() => console.log('Keypad toggle - TODO: Implement keypad overlay')}
                                        aria-label="Toggle keypad"
                                        className="flex flex-col items-center gap-1 text-slate-400"
                                    >
                                        <div className="w-14 h-14 rounded-full bg-transparent border border-slate-600 flex items-center justify-center">
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
                                        <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isSpeaker ? 'bg-white text-slate-900' : 'bg-transparent border border-slate-600'}`}>
                                            {isSpeaker ? <Volume2 size={24} /> : <VolumeX size={24} />}
                                        </div>
                                        <span className="text-[10px]">Speaker</span>
                                    </button>
                                </div>

                                <div className="flex justify-center">
                                    <button
                                        onClick={handleCall}
                                        aria-label="End call"
                                        className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-400 flex items-center justify-center text-white shadow-lg shadow-red-500/30 transition-all transform hover:scale-105"
                                    >
                                        <PhoneOff size={28} fill="currentColor" />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default PhoneSimulator;

