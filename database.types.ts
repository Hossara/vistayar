export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    public: {
        Tables: {
            goals: {
                Row: {
                    created_at: string
                    id: string
                    reading_time: number | null
                    reports: string | null
                    test_count: number | null
                    user: string
                }
                Insert: {
                    created_at?: string
                    id?: string
                    reading_time?: number | null
                    reports?: string | null
                    test_count?: number | null
                    user?: string
                }
                Update: {
                    created_at?: string
                    id?: string
                    reading_time?: number | null
                    reports?: string | null
                    test_count?: number | null
                    user?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "goals_reports_fkey"
                        columns: ["reports"]
                        isOneToOne: false
                        referencedRelation: "reports"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "goals_user_fkey"
                        columns: ["user"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            reports: {
                Row: {
                    friday: Json | null
                    id: string
                    monday: Json | null
                    saturday: Json | null
                    sunday: Json | null
                    thursday: Json | null
                    tuesday: Json | null
                    user: string
                    wednesday: Json | null
                }
                Insert: {
                    friday?: Json | null
                    id?: string
                    monday?: Json | null
                    saturday?: Json | null
                    sunday?: Json | null
                    thursday?: Json | null
                    tuesday?: Json | null
                    user?: string
                    wednesday?: Json | null
                }
                Update: {
                    friday?: Json | null
                    id?: string
                    monday?: Json | null
                    saturday?: Json | null
                    sunday?: Json | null
                    thursday?: Json | null
                    tuesday?: Json | null
                    user?: string
                    wednesday?: Json | null
                }
                Relationships: [
                    {
                        foreignKeyName: "reports_user_fkey"
                        columns: ["user"]
                        isOneToOne: false
                        referencedRelation: "users"
                        referencedColumns: ["id"]
                    },
                ]
            }
            users: {
                Row: {
                    created_at: string
                    first_name: string | null
                    id: string
                    last_name: string | null
                    password: string | null
                    phone: string | null
                    role: string | null
                }
                Insert: {
                    created_at?: string
                    first_name?: string | null
                    id?: string
                    last_name?: string | null
                    password?: string | null
                    phone?: string | null
                    role?: string | null
                }
                Update: {
                    created_at?: string
                    first_name?: string | null
                    id?: string
                    last_name?: string | null
                    password?: string | null
                    phone?: string | null
                    role?: string | null
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
    PublicTableNameOrOptions extends
            | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
            Database[PublicTableNameOrOptions["schema"]]["Views"])
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
        ? R
        : never
    : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
            PublicSchema["Views"])
        ? (PublicSchema["Tables"] &
            PublicSchema["Views"])[PublicTableNameOrOptions] extends {
                Row: infer R
            }
            ? R
            : never
        : never

export type TablesInsert<
    PublicTableNameOrOptions extends
            | keyof PublicSchema["Tables"]
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
            Insert: infer I
        }
        ? I
        : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
        ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
                Insert: infer I
            }
            ? I
            : never
        : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
            | keyof PublicSchema["Tables"]
        | { schema: keyof Database },
    TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
        : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
    ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
            Update: infer U
        }
        ? U
        : never
    : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
        ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
                Update: infer U
            }
            ? U
            : never
        : never

export type Enums<
    PublicEnumNameOrOptions extends
            | keyof PublicSchema["Enums"]
        | { schema: keyof Database },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
        ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
        : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
    ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
        ? PublicSchema["Enums"][PublicEnumNameOrOptions]
        : never