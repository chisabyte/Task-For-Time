export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    role: 'parent' | 'child'
                    display_name: string
                    family_id: string
                    created_at: string
                    pin_hash: string | null
                    pin_salt: string | null
                }
                Insert: {
                    id: string
                    role: 'parent' | 'child'
                    display_name: string
                    family_id: string
                    created_at?: string
                    pin_hash?: string | null
                    pin_salt?: string | null
                }
                Update: {
                    id?: string
                    role?: 'parent' | 'child'
                    display_name?: string
                    family_id?: string
                    created_at?: string
                    pin_hash?: string | null
                    pin_salt?: string | null
                }
            }
            families: {
                Row: {
                    id: string
                    name: string
                    created_by: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    created_by: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    created_by?: string
                    created_at?: string
                }
            }
            children: {
                Row: {
                    id: string
                    family_id: string
                    name: string
                    avatar_url: string | null
                    level: number
                    xp: number
                    time_bank_minutes: number
                    auth_user_id: string | null
                    created_at: string
                    deleted_at: string | null
                    pin: string | null
                }
                Insert: {
                    id?: string
                    family_id: string
                    name: string
                    avatar_url?: string | null
                    level?: number
                    xp?: number
                    time_bank_minutes?: number
                    auth_user_id?: string | null
                    created_at?: string
                    deleted_at?: string | null
                    pin?: string | null
                }
                Update: {
                    id?: string
                    family_id?: string
                    name?: string
                    avatar_url?: string | null
                    level?: number
                    xp?: number
                    time_bank_minutes?: number
                    auth_user_id?: string | null
                    created_at?: string
                    deleted_at?: string | null
                    pin?: string | null
                }
            }
            rewards: {
                Row: {
                    id: string
                    family_id: string
                    title: string
                    cost_minutes: number
                    icon: string | null
                    status: 'available' | 'redeemed' | 'consumed'
                    created_at: string
                }
                Insert: {
                    id?: string
                    family_id: string
                    title: string
                    cost_minutes: number
                    icon?: string | null
                    status?: 'available' | 'redeemed' | 'consumed'
                    created_at?: string
                }
                Update: {
                    id?: string
                    family_id?: string
                    title?: string
                    cost_minutes?: number
                    icon?: string | null
                    status?: 'available' | 'redeemed' | 'consumed'
                    created_at?: string
                }
            }
            reward_redemptions: {
                Row: {
                    id: string
                    family_id: string
                    child_id: string
                    reward_id: string
                    minutes_spent: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    family_id: string
                    child_id: string
                    reward_id: string
                    minutes_spent: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    family_id?: string
                    child_id?: string
                    reward_id?: string
                    minutes_spent?: number
                    created_at?: string
                }
            }
            tasks: {
                Row: {
                    id: string
                    family_id: string
                    title: string
                    description: string | null
                    category: string | null
                    reward_minutes: number
                    requires_approval: boolean
                    active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    family_id: string
                    title: string
                    description?: string | null
                    category?: string | null
                    reward_minutes: number
                    requires_approval?: boolean
                    active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    family_id?: string
                    title?: string
                    description?: string | null
                    category?: string | null
                    reward_minutes?: number
                    requires_approval?: boolean
                    active?: boolean
                    created_at?: string
                }
            }
            task_templates: {
                Row: {
                    id: string
                    family_id: string
                    title: string
                    description: string | null
                    category: string | null
                    default_reward_minutes: number
                    requires_approval: boolean
                    active: boolean
                    created_at: string
                    created_by: string | null
                }
                Insert: {
                    id?: string
                    family_id: string
                    title: string
                    description?: string | null
                    category?: string | null
                    default_reward_minutes: number
                    requires_approval?: boolean
                    active?: boolean
                    created_at?: string
                    created_by?: string | null
                }
                Update: {
                    id?: string
                    family_id?: string
                    title?: string
                    description?: string | null
                    category?: string | null
                    default_reward_minutes?: number
                    requires_approval?: boolean
                    active?: boolean
                    created_at?: string
                    created_by?: string | null
                }
            }
            assigned_tasks: {
                Row: {
                    id: string
                    family_id: string
                    child_id: string
                    template_id: string | null
                    title: string
                    description: string | null
                    category: string | null
                    reward_minutes: number
                    requires_approval: boolean
                    status: 'active' | 'ready_for_review' | 'approved' | 'rejected'
                    created_at: string
                    created_by: string | null
                }
                Insert: {
                    id?: string
                    family_id: string
                    child_id: string
                    template_id?: string | null
                    title: string
                    description?: string | null
                    category?: string | null
                    reward_minutes: number
                    requires_approval?: boolean
                    status?: 'active' | 'ready_for_review' | 'approved' | 'rejected'
                    created_at?: string
                    created_by?: string | null
                }
                Update: {
                    id?: string
                    family_id?: string
                    child_id?: string
                    template_id?: string | null
                    title?: string
                    description?: string | null
                    category?: string | null
                    reward_minutes?: number
                    requires_approval?: boolean
                    status?: 'active' | 'ready_for_review' | 'approved' | 'rejected'
                    created_at?: string
                    created_by?: string | null
                }
            }
            submissions: {
                Row: {
                    id: string
                    family_id: string
                    child_id: string
                    task_id: string
                    status: 'pending' | 'approved' | 'discuss'
                    note: string | null
                    proof_image_path: string | null
                    submitted_at: string
                    reviewed_at: string | null
                    reviewed_by: string | null
                }
                Insert: {
                    id?: string
                    family_id: string
                    child_id: string
                    task_id: string
                    status: 'pending' | 'approved' | 'discuss'
                    note?: string | null
                    proof_image_path?: string | null
                    submitted_at?: string
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                }
                Update: {
                    id?: string
                    family_id?: string
                    child_id?: string
                    task_id?: string
                    status?: 'pending' | 'approved' | 'discuss'
                    note?: string | null
                    proof_image_path?: string | null
                    submitted_at?: string
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                }
            }
            settings: {
                Row: {
                    family_id: string
                    dark_mode_default: boolean
                    notifications_enabled: boolean
                }
                Insert: {
                    family_id: string
                    dark_mode_default?: boolean
                    notifications_enabled?: boolean
                }
                Update: {
                    family_id?: string
                    dark_mode_default?: boolean
                    notifications_enabled?: boolean
                }
            }
            assigned_task_submissions: {
                Row: {
                    id: string
                    family_id: string
                    child_id: string
                    assigned_task_id: string
                    status: 'pending' | 'approved' | 'discuss'
                    note: string | null
                    proof_image_path: string | null
                    submitted_at: string
                    reviewed_at: string | null
                    reviewed_by: string | null
                }
                Insert: {
                    id?: string
                    family_id: string
                    child_id: string
                    assigned_task_id: string
                    status: 'pending' | 'approved' | 'discuss'
                    note?: string | null
                    proof_image_path?: string | null
                    submitted_at?: string
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                }
                Update: {
                    id?: string
                    family_id?: string
                    child_id?: string
                    assigned_task_id?: string
                    status?: 'pending' | 'approved' | 'discuss'
                    note?: string | null
                    proof_image_path?: string | null
                    submitted_at?: string
                    reviewed_at?: string | null
                    reviewed_by?: string | null
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            approve_submission: {
                Args: {
                    submission_id: string
                }
                Returns: void
            }
            approve_assigned_task_submission: {
                Args: {
                    submission_id: string
                }
                Returns: void
            }
            discuss_assigned_task_submission: {
                Args: {
                    submission_id: string
                    discuss_note: string
                }
                Returns: void
            }
            verify_child_pin: {
                Args: {
                    p_child_id: string
                    input_pin: string
                }
                Returns: boolean
            }
            verify_parent_pin: {
                Args: {
                    p_user_id: string
                    input_pin: string
                }
                Returns: boolean
            }
            set_parent_pin: {
                Args: {
                    p_user_id: string
                    new_pin: string
                }
                Returns: boolean
            }
            is_pin_rate_limited: {
                Args: {
                    p_user_id?: string
                    p_child_id?: string
                }
                Returns: boolean
            }
            clear_pin_rate_limit: {
                Args: {
                    p_child_id: string
                }
                Returns: boolean
            }
            redeem_reward: {
                Args: {
                    reward_id: string
                    child_id: string
                }
                Returns: void
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}
