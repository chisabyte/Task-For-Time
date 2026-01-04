import { SubmissionWithDetails } from "./ApprovalModal";
import { ChildAvatar } from "@/components/ChildAvatar";

interface ReviewQueueProps {
    submissions: SubmissionWithDetails[];
    onReview: (submission: SubmissionWithDetails) => void;
    selectedTasks?: Set<string>;
    onToggleSelect?: (taskId: string) => void;
}

const getCategoryColor = (category: string | null) => {
    switch (category?.toLowerCase()) {
        case 'morning': return 'bg-orange-100 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400';
        case 'learning': return 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400';
        case 'chore': return 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400';
        default: return 'bg-teal-100 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400';
    }
};

const getBorderColor = (category: string | null) => {
    switch (category?.toLowerCase()) {
        case 'morning': return 'bg-orange-400';
        case 'learning': return 'bg-blue-400';
        case 'chore': return 'bg-purple-400';
        default: return 'bg-teal-400';
    }
};

export function ReviewQueue({ submissions, onReview, selectedTasks, onToggleSelect }: ReviewQueueProps) {
    if (submissions.length === 0) {
        return (
            <div className="text-center p-12 bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-gray-700">
                <div className="mb-4 bg-gray-50 dark:bg-gray-800 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-3xl text-gray-400">check_circle</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">All Caught Up!</h3>
                <p className="text-gray-500 dark:text-gray-400">No exceptions requiring your attention. Most tasks are auto-approved.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((submission) => {
                const isSelected = selectedTasks?.has(submission.id) || false;
                return (
                <div
                    key={submission.id}
                    className={`bg-white dark:bg-card-dark rounded-2xl p-6 shadow-sm border-2 transition-all group relative overflow-hidden ${
                        isSelected 
                            ? 'border-primary shadow-lg' 
                            : 'border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-primary/30'
                    }`}
                >
                    {onToggleSelect && (
                        <div className="absolute top-4 right-4">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                    e.stopPropagation();
                                    onToggleSelect(submission.id);
                                }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
                            />
                        </div>
                    )}
                    <div
                        onClick={() => onReview(submission)}
                        className="cursor-pointer"
                    >
                    <div className={`absolute top-0 left-0 w-1 h-full ${getBorderColor(submission.task.category)} group-hover:w-2 transition-all`}></div>
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <ChildAvatar
                                childId={submission.child.id}
                                childName={submission.child.name}
                                size={40}
                                className="border-2 border-white dark:border-gray-600"
                            />
                            <div>
                                <h3 className="font-bold text-teal-900 dark:text-white">{submission.child.name}</h3>
                                <span className="text-xs text-text-sub-light dark:text-text-sub-dark">
                                    {new Date(submission.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                        <span className={`${getCategoryColor(submission.task.category)} text-xs font-bold px-2 py-1 rounded capitalize`}>
                            {submission.task.category || 'Task'}
                        </span>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{submission.task.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2">
                        {submission.note || "No note provided."}
                    </p>
                    <div className="flex items-center justify-between mt-auto">
                        <span className="flex items-center gap-1 text-sm font-bold text-primary-dark dark:text-primary">
                            <span className="material-symbols-outlined text-[18px] fill-1">bolt</span> +{submission.task.reward_minutes} min
                        </span>
                        <button className="px-4 py-2 bg-primary/10 text-primary-dark dark:text-primary font-bold rounded-lg text-sm hover:bg-primary hover:text-teal-900 transition-colors">
                            Review
                        </button>
                    </div>
                    </div>
                </div>
                );
            })}
        </div>
    );
}
