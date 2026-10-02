
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "graphql_public": {
          Tables: {
            [_ in never]: never
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "graphql":
{ Args: { "extensions"?: Json,"operationName"?: string,"query"?: string,"variables"?: Json }; Returns: Json
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        },"public": {
          Tables: {
            "audit_logs": {
                  Row: {
                    "action": string,"actor_id": string | null,"committee_id": string | null,"entity_id": string,"entity_type": string,"id": number,"occurred_at": string,"request_id": string | null,"summary": NonNullable<Json>
                  }
                  Insert: {
                    "action": string,"actor_id"?: string | null,"committee_id"?: string | null,"entity_id": string,"entity_type": string,"id"?: never,"occurred_at"?: string,"request_id"?: string | null,"summary"?: NonNullable<Json>
                  }
                  Update: {
                    "action"?: string,"actor_id"?: string | null,"committee_id"?: string | null,"entity_id"?: string,"entity_type"?: string,"id"?: never,"occurred_at"?: string,"request_id"?: string | null,"summary"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_logs_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"committees": {
                  Row: {
                    "contact_email": string | null,"created_at": string,"created_by": string | null,"description_ar": string | null,"description_en": string | null,"display_order": number,"id": string,"name_ar": string,"name_en": string | null,"slug": string,"status": string,"updated_at": string
                  }
                  Insert: {
                    "contact_email"?: string | null,"created_at"?: string,"created_by"?: string | null,"description_ar"?: string | null,"description_en"?: string | null,"display_order"?: number,"id"?: string,"name_ar": string,"name_en"?: string | null,"slug": string,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "contact_email"?: string | null,"created_at"?: string,"created_by"?: string | null,"description_ar"?: string | null,"description_en"?: string | null,"display_order"?: number,"id"?: string,"name_ar"?: string,"name_en"?: string | null,"slug"?: string,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "committees_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"event_registrations": {
                  Row: {
                    "created_at": string | null,"email": string | null,"event_id": number,"full_name": string | null,"id": number,"status": string | null,"user_id": string | null
                  }
                  Insert: {
                    "created_at"?: string | null,"email"?: string | null,"event_id": number,"full_name"?: string | null,"id"?: number,"status"?: string | null,"user_id"?: string | null
                  }
                  Update: {
                    "created_at"?: string | null,"email"?: string | null,"event_id"?: number,"full_name"?: string | null,"id"?: number,"status"?: string | null,"user_id"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"members": {
                  Row: {
                    "bio": string | null,"bio_en": string | null,"created_at": string | null,"first_name": string | null,"first_name_en": string | null,"github_url": string | null,"id": number,"last_name": string | null,"last_name_en": string | null,"linkedin_url": string | null,"major": string | null,"major_en": string | null,"portfolio_url": string | null,"status": string | null,"status_en": string | null,"sub_major": string | null,"sub_major_en": string | null,"track": string | null,"track_en": string | null,"university": string | null,"university_en": string | null,"x_url": string | null
                  }
                  Insert: {
                    "bio"?: string | null,"bio_en"?: string | null,"created_at"?: string | null,"first_name"?: string | null,"first_name_en"?: string | null,"github_url"?: string | null,"id"?: number,"last_name"?: string | null,"last_name_en"?: string | null,"linkedin_url"?: string | null,"major"?: string | null,"major_en"?: string | null,"portfolio_url"?: string | null,"status"?: string | null,"status_en"?: string | null,"sub_major"?: string | null,"sub_major_en"?: string | null,"track"?: string | null,"track_en"?: string | null,"university"?: string | null,"university_en"?: string | null,"x_url"?: string | null
                  }
                  Update: {
                    "bio"?: string | null,"bio_en"?: string | null,"created_at"?: string | null,"first_name"?: string | null,"first_name_en"?: string | null,"github_url"?: string | null,"id"?: number,"last_name"?: string | null,"last_name_en"?: string | null,"linkedin_url"?: string | null,"major"?: string | null,"major_en"?: string | null,"portfolio_url"?: string | null,"status"?: string | null,"status_en"?: string | null,"sub_major"?: string | null,"sub_major_en"?: string | null,"track"?: string | null,"track_en"?: string | null,"university"?: string | null,"university_en"?: string | null,"x_url"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"permissions": {
                  Row: {
                    "description_ar": string,"description_en": string,"key": string,"module": string
                  }
                  Insert: {
                    "description_ar": string,"description_en": string,"key": string,"module": string
                  }
                  Update: {
                    "description_ar"?: string,"description_en"?: string,"key"?: string,"module"?: string
                  }
                  Relationships: [
                    
                  ]
                },"profiles": {
                  Row: {
                    "avatar_path": string | null,"created_at": string,"email": string,"full_name_ar": string,"full_name_en": string | null,"id": string,"preferred_locale": string,"updated_at": string
                  }
                  Insert: {
                    "avatar_path"?: string | null,"created_at"?: string,"email": string,"full_name_ar": string,"full_name_en"?: string | null,"id": string,"preferred_locale"?: string,"updated_at"?: string
                  }
                  Update: {
                    "avatar_path"?: string | null,"created_at"?: string,"email"?: string,"full_name_ar"?: string,"full_name_en"?: string | null,"id"?: string,"preferred_locale"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    
                  ]
                },"role_assignments": {
                  Row: {
                    "assigned_by": string | null,"committee_id": string | null,"created_at": string,"display_title_ar": string | null,"display_title_en": string | null,"end_reason": string | null,"ended_by": string | null,"ends_at": string | null,"id": string,"public_bio_ar": string | null,"public_bio_en": string | null,"public_tags_ar": (string)[] | null,"public_tags_en": (string)[] | null,"role_key": string,"starts_at": string,"updated_at": string,"user_id": string
                  }
                  Insert: {
                    "assigned_by"?: string | null,"committee_id"?: string | null,"created_at"?: string,"display_title_ar"?: string | null,"display_title_en"?: string | null,"end_reason"?: string | null,"ended_by"?: string | null,"ends_at"?: string | null,"id"?: string,"public_bio_ar"?: string | null,"public_bio_en"?: string | null,"public_tags_ar"?: (string)[] | null,"public_tags_en"?: (string)[] | null,"role_key": string,"starts_at"?: string,"updated_at"?: string,"user_id": string
                  }
                  Update: {
                    "assigned_by"?: string | null,"committee_id"?: string | null,"created_at"?: string,"display_title_ar"?: string | null,"display_title_en"?: string | null,"end_reason"?: string | null,"ended_by"?: string | null,"ends_at"?: string | null,"id"?: string,"public_bio_ar"?: string | null,"public_bio_en"?: string | null,"public_tags_ar"?: (string)[] | null,"public_tags_en"?: (string)[] | null,"role_key"?: string,"starts_at"?: string,"updated_at"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "role_assignments_assigned_by_fkey"
      columns: ["assigned_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "role_assignments_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "committees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "role_assignments_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "current_positions"
      referencedColumns: ["committee_id"]
    },{
      foreignKeyName: "role_assignments_ended_by_fkey"
      columns: ["ended_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "role_assignments_role_key_fkey"
      columns: ["role_key"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["key"]
    },{
      foreignKeyName: "role_assignments_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"role_permissions": {
                  Row: {
                    "permission_key": string,"role_key": string
                  }
                  Insert: {
                    "permission_key": string,"role_key": string
                  }
                  Update: {
                    "permission_key"?: string,"role_key"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "role_permissions_permission_key_fkey"
      columns: ["permission_key"]
isOneToOne: false
      referencedRelation: "permissions"
      referencedColumns: ["key"]
    },{
      foreignKeyName: "role_permissions_role_key_fkey"
      columns: ["role_key"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["key"]
    }
                  ]
                },"roles": {
                  Row: {
                    "description_ar": string | null,"description_en": string | null,"display_order": number,"is_public_position": boolean,"key": string,"name_ar": string,"name_en": string,"scope": string
                  }
                  Insert: {
                    "description_ar"?: string | null,"description_en"?: string | null,"display_order"?: number,"is_public_position"?: boolean,"key": string,"name_ar": string,"name_en": string,"scope": string
                  }
                  Update: {
                    "description_ar"?: string | null,"description_en"?: string | null,"display_order"?: number,"is_public_position"?: boolean,"key"?: string,"name_ar"?: string,"name_en"?: string,"scope"?: string
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "current_positions": {
                  Row: {
                    "assignment_id": string | null,"committee_id": string | null,"committee_name_ar": string | null,"committee_name_en": string | null,"committee_order": number | null,"committee_slug": string | null,"display_title_ar": string | null,"display_title_en": string | null,"ends_at": string | null,"person_name_ar": string | null,"person_name_en": string | null,"public_bio_ar": string | null,"public_bio_en": string | null,"public_tags_ar": (string)[] | null,"public_tags_en": (string)[] | null,"role_key": string | null,"role_name_ar": string | null,"role_name_en": string | null,"role_order": number | null,"starts_at": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "role_assignments_role_key_fkey"
      columns: ["role_key"]
isOneToOne: false
      referencedRelation: "roles"
      referencedColumns: ["key"]
    }
                  ]
                }
          }
          Functions: {
            "assign_role":
{ Args: { "p_bio_ar"?: string,"p_bio_en"?: string,"p_committee"?: string,"p_ends_at"?: string,"p_role": string,"p_starts_at"?: string,"p_tags_ar"?: (string)[],"p_tags_en"?: (string)[],"p_title_ar"?: string,"p_title_en"?: string,"p_user": string }; Returns: string
                           },
"end_role_assignment":
{ Args: { "p_ends_at"?: string,"p_id": string,"p_reason": string }; Returns: undefined
                           },
"handover_head":
{ Args: { "p_at"?: string,"p_committee": string,"p_new_head": string }; Returns: string
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "graphql_public": {
          Enums: {
            
          }
        },"public": {
          Enums: {
            
          }
        }
} as const
