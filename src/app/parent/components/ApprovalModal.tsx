"use client";

import { useState } from "react";
import { Database } from "@/types/supabase";
import { ChildAvatar } from "@/components/ChildAvatar";

// Complex joined type, simplified for usage
export interface SubmissionWithDetails {
    id: string;
    submitted_at: string;
    note: string | null;
    proof_image_path: string | null;
    child: {
        id: string;
        name: string;
        avatar_url: string | null;
        time_bank_minutes: number;
    };
    task: {
        title: string;
        category: string | null;
        reward_minutes: number;
    };
}

interface ApprovalModalProps {
    submission: SubmissionWithDetails;
    onClose: () => void;
    onApprove: (id: string) => void;
    onDiscuss?: (id: string, note: string) => void;
    isApproving?: boolean;
    isDiscussing?: boolean;
}

export function ApprovalModal({ submission, onClose, onApprove, onDiscuss, isApproving = false, isDiscussing = false }: ApprovalModalProps) {
    const { child, task } = submission;
    const [showDiscussInput, setShowDiscussInput] = useState(false);
    const [discussNote, setDiscussNote] = useState("");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-teal-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>
            <div className="relative w-full max-w-lg bg-white dark:bg-card-dark rounded-3xl shadow-2xl overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
                <div className="p-6 pb-2 flex justify-between items-center border-b border-gray-50 dark:border-gray-800/50">
                    <h2 className="text-xl font-black text-teal-900 dark:text-white flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">approval_delegation</span>
                        Review Task
                    </h2>
                    <button onClick={onClose} className="h-8 w-8 rounded-full bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                        <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                </div>
                <div className="p-6 md:p-8 overflow-y-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                            <ChildAvatar
                                childId={child.id}
                                childName={child.name}
                                size={64}
                                className="border-2 border-white dark:border-gray-600 shadow-md"
                            />
                            <div className="absolute -bottom-1 -right-1 bg-primary text-teal-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white dark:border-gray-800">
                                {child.name}
                            </div>
                        </div>
                        <div>
                            <div className="text-xs font-bold text-text-sub-light dark:text-text-sub-dark uppercase tracking-wide mb-1">Task Completed</div>
                            <h3 className="text-2xl font-bold text-teal-900 dark:text-white leading-tight">{task.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded font-medium">{task.category || 'Task'}</span>
                                <span className="text-xs text-gray-400">•</span>
                                <span className="text-xs text-gray-500 font-medium">{new Date(submission.submitted_at).toLocaleDateString()} at {new Date(submission.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 mb-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-gray-400 mt-0.5">format_quote</span>
                            <div className="w-full">
                                {submission.note ? (
                                    <p className="text-gray-700 dark:text-gray-300 text-sm font-medium italic">
                                        &quot;{submission.note}&quot;
                                    </p>
                                ) : (
                                    <p className="text-gray-400 text-sm italic">No note provided.</p>
                                )}
                                <div className="mt-3 relative group rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-700 h-32 w-full flex items-center justify-center cursor-pointer">
                                    {submission.proof_image_path ? (
                                        // TODO: Handle Image URL from Supabase Storage
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">image</span> Use Storage to view image
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-sm">image</span> No photo attached
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-4 mb-8">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/20 text-primary-dark dark:text-primary flex items-center justify-center">
                                <span className="material-symbols-outlined">bolt</span>
                            </div>
                            <div>
                                <p className="text-xs text-teal-800 dark:text-teal-200 font-bold uppercase">Reward</p>
                                <p className="font-bold text-teal-900 dark:text-white">+{task.reward_minutes} Minutes Screen Time</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-gray-400 block">Current Balance</span>
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                {Math.floor(child.time_bank_minutes / 60)}h {child.time_bank_minutes % 60}m
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => onApprove(submission.id)}
                            disabled={isApproving}
                            className="w-full py-3.5 bg-primary hover:bg-primary-dark text-teal-900 font-black rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-95 text-base flex items-center justify-center gap-2 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                            {isApproving ? (
                                <>
                                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-teal-900 border-t-transparent"></div>
                                    Approving...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">celebration</span>
                                    Approve & Celebrate!
                                </>
                            )}
                        </button>
                        {!showDiscussInput ? (
                            <button 
                                onClick={() => setShowDiscussInput(true)}
                                disabled={isApproving || isDiscussing}
                                className="w-full py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors active:scale-95 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <span className="material-symbols-outlined text-gray-500">chat_bubble</span>
                                Discuss with {child.name}
                            </button>
                        ) : (
                            <div className="space-y-3">
                                <textarea
                                    value={discussNote}
                                    onChange={(e) => setDiscussNote(e.target.value)}
                                    placeholder={`What would you like to discuss with ${child.name} about this task?`}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                                    rows={3}
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            if (onDiscuss && discussNote.trim()) {
                                                onDiscuss(submission.id, discussNote.trim());
                                            }
                                        }}
                                        disabled={!discussNote.trim() || isDiscussing}
                                        className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors active:scale-95 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isDiscussing ? (
                                            <>
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <span className="material-symbols-outlined text-[18px]">send</span>
                                                Send Discussion Note
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => {
                                            setShowDiscussInput(false);
                                            setDiscussNote("");
                                        }}
                                        disabled={isDiscussing}
                                        className="px-4 py-2.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                        <p className="text-center text-[10px] text-gray-400 mt-2">
                            Positive reinforcement builds better habits. Avoid rejection when possible.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
