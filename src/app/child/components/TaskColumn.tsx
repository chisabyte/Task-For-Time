import { Database } from "@/types/supabase";

type Task = Database['public']['Tables']['tasks']['Row'];

interface ExtendedTask extends Task {
    status?: string;
}

interface TaskColumnProps {
    tasks: ExtendedTask[];
    completedCount: number;
    onComplete: (taskId: string) => void;
    completingTaskId?: string | null;
}

const getCategoryIcon = (category: string | null) => {
    switch (category?.toLowerCase()) {
        case 'morning': return 'bed';
        case 'learning': return 'menu_book';
        case 'chore': return 'pets';
        default: return 'task_alt';
    }
};

const getCategoryColor = (category: string | null) => {
    switch (category?.toLowerCase()) {
        case 'morning': return 'text-orange-500 bg-orange-100 dark:bg-orange-900/20';
        case 'learning': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
        case 'chore': return 'text-purple-500 bg-purple-100 dark:bg-purple-900/20';
        default: return 'text-teal-500 bg-teal-100 dark:bg-teal-900/20';
    }
};

const getBorderColor = (category: string | null, status?: string) => {
    if (status === 'rejected') return 'bg-red-500';
    switch (category?.toLowerCase()) {
        case 'morning': return 'bg-orange-400';
        case 'learning': return 'bg-blue-400';
        case 'chore': return 'bg-purple-400';
        default: return 'bg-teal-400';
    }
};

export function TaskColumn({ tasks, completedCount, onComplete, completingTaskId = null }: TaskColumnProps) {
    // We expect the parent to filter active tasks, but we keep this as safety
    // Also include 'rejected' status as active for display
    const activeTasks = tasks.filter(t => t.active);

    return (
        <section className="flex-1 flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black tracking-tight text-teal-900 dark:text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-3xl">lightbulb</span>
                    What&apos;s Next?
                </h2>
                <div className="flex items-center gap-2">
                    <span className="bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 text-xs font-bold px-3 py-1 rounded-full">{activeTasks.length} Active</span>
                    <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        {completedCount} Completed
                    </span>
                </div>
            </div>

            {activeTasks.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-card-dark rounded-2xl border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500">No active tasks! Good job!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {activeTasks.map(task => (
                        <article key={task.id} className="bg-white dark:bg-card-dark rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-primary/30 transition-all flex flex-col gap-4 group cursor-pointer relative overflow-hidden">
                            <div className={`absolute top-0 left-0 w-2 h-full ${getBorderColor(task.category, task.status)} group-hover:w-3 transition-all`}></div>

                            {task.status === 'rejected' && (
                                <div className="absolute top-0 right-0 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-3 py-1 rounded-bl-xl text-xs font-bold border-l border-b border-red-200 dark:border-red-900/50 flex items-center gap-1 z-10">
                                    <span className="material-symbols-outlined text-[14px]">priority_high</span>
                                    Needs Revision
                                </div>
                            )}

                            <div className="flex justify-between items-start pl-2">
                                <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${getCategoryColor(task.category)}`}>
                                    <span className="material-symbols-outlined text-2xl">{getCategoryIcon(task.category)}</span>
                                </div>
                                {!task.status || task.status !== 'rejected' ? (
                                    <span className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded border border-gray-100 dark:border-gray-600 capitalize">{task.category || 'Task'}</span>
                                ) : null}
                            </div>
                            <div className="pl-2">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{task.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{task.description}</p>
                            </div>
                            <div className="mt-auto pl-2 flex items-center justify-between gap-3 pt-2">
                                <span className="flex items-center gap-1 text-sm font-bold text-primary-dark dark:text-primary">
                                    <span className="material-symbols-outlined text-[18px] fill-1">bolt</span> +{task.reward_minutes} min
                                </span>
                                <button
                                    onClick={() => onComplete(task.id)}
                                    disabled={completingTaskId === task.id}
                                    className={`px-5 py-2.5 ${task.status === 'rejected' ? 'bg-red-50 hover:bg-red-500 text-red-700 hover:text-white' : 'bg-gray-100 dark:bg-gray-800 hover:bg-green-500 hover:text-white text-gray-900 dark:text-white'} font-bold rounded-xl text-sm transition-colors shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-100 dark:disabled:hover:bg-gray-800`}
                                >
                                    {completingTaskId === task.id ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            {task.status === 'rejected' ? 'Try Again' : 'I did it!'}
                                            <span className="material-symbols-outlined text-[18px]">{task.status === 'rejected' ? 'refresh' : 'check'}</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </section>
    );
}
