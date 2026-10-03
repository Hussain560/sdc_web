
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
            "article_authors": {
                  Row: {
                    "article_id": string,"committee_id": string | null,"display_name_ar": string | null,"display_name_en": string | null,"position": number,"user_id": string | null
                  }
                  Insert: {
                    "article_id": string,"committee_id"?: string | null,"display_name_ar"?: string | null,"display_name_en"?: string | null,"position": number,"user_id"?: string | null
                  }
                  Update: {
                    "article_id"?: string,"committee_id"?: string | null,"display_name_ar"?: string | null,"display_name_en"?: string | null,"position"?: number,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "article_authors_article_id_fkey"
      columns: ["article_id"]
isOneToOne: false
      referencedRelation: "articles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "article_authors_article_id_fkey"
      columns: ["article_id"]
isOneToOne: false
      referencedRelation: "dashboard_articles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "article_authors_article_id_fkey"
      columns: ["article_id"]
isOneToOne: false
      referencedRelation: "public_articles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "article_authors_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "committees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "article_authors_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "current_positions"
      referencedColumns: ["committee_id"]
    },{
      foreignKeyName: "article_authors_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"article_tags": {
                  Row: {
                    "article_id": string,"position": number,"tag_id": string
                  }
                  Insert: {
                    "article_id": string,"position"?: number,"tag_id": string
                  }
                  Update: {
                    "article_id"?: string,"position"?: number,"tag_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "article_tags_article_id_fkey"
      columns: ["article_id"]
isOneToOne: false
      referencedRelation: "articles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "article_tags_article_id_fkey"
      columns: ["article_id"]
isOneToOne: false
      referencedRelation: "dashboard_articles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "article_tags_article_id_fkey"
      columns: ["article_id"]
isOneToOne: false
      referencedRelation: "public_articles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "article_tags_tag_id_fkey"
      columns: ["tag_id"]
isOneToOne: false
      referencedRelation: "tags"
      referencedColumns: ["id"]
    }
                  ]
                },"articles": {
                  Row: {
                    "archived_at": string | null,"body_ar": string,"body_en": string | null,"committee_id": string | null,"cover_image_path": string | null,"created_at": string,"created_by": string | null,"excerpt_ar": string | null,"excerpt_en": string | null,"id": string,"legacy_id": number | null,"published_at": string | null,"reading_minutes": number,"resource_label_ar": string | null,"resource_label_en": string | null,"resource_url": string | null,"review_note": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"slug": string,"status": string,"submitted_at": string | null,"submitted_by": string | null,"title_ar": string,"title_en": string | null,"updated_at": string
                  }
                  Insert: {
                    "archived_at"?: string | null,"body_ar"?: string,"body_en"?: string | null,"committee_id"?: string | null,"cover_image_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"excerpt_ar"?: string | null,"excerpt_en"?: string | null,"id"?: string,"legacy_id"?: number | null,"published_at"?: string | null,"reading_minutes"?: number,"resource_label_ar"?: string | null,"resource_label_en"?: string | null,"resource_url"?: string | null,"review_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"slug": string,"status"?: string,"submitted_at"?: string | null,"submitted_by"?: string | null,"title_ar": string,"title_en"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "archived_at"?: string | null,"body_ar"?: string,"body_en"?: string | null,"committee_id"?: string | null,"cover_image_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"excerpt_ar"?: string | null,"excerpt_en"?: string | null,"id"?: string,"legacy_id"?: number | null,"published_at"?: string | null,"reading_minutes"?: number,"resource_label_ar"?: string | null,"resource_label_en"?: string | null,"resource_url"?: string | null,"review_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"slug"?: string,"status"?: string,"submitted_at"?: string | null,"submitted_by"?: string | null,"title_ar"?: string,"title_en"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "articles_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "committees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "articles_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "current_positions"
      referencedColumns: ["committee_id"]
    },{
      foreignKeyName: "articles_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "articles_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "articles_submitted_by_fkey"
      columns: ["submitted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"attendance_records": {
                  Row: {
                    "checked_in_at": string,"id": string,"method": string,"recorded_by": string | null,"registration_id": string,"session_id": string
                  }
                  Insert: {
                    "checked_in_at"?: string,"id"?: string,"method": string,"recorded_by"?: string | null,"registration_id": string,"session_id": string
                  }
                  Update: {
                    "checked_in_at"?: string,"id"?: string,"method"?: string,"recorded_by"?: string | null,"registration_id"?: string,"session_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_records_recorded_by_fkey"
      columns: ["recorded_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_records_registration_id_fkey"
      columns: ["registration_id"]
isOneToOne: false
      referencedRelation: "event_registrations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_records_registration_id_fkey"
      columns: ["registration_id"]
isOneToOne: false
      referencedRelation: "my_registrations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_records_session_id_fkey"
      columns: ["session_id"]
isOneToOne: false
      referencedRelation: "attendance_sessions"
      referencedColumns: ["id"]
    }
                  ]
                },"attendance_sessions": {
                  Row: {
                    "closed_at": string | null,"closed_by": string | null,"created_at": string,"event_date_id": string,"event_id": string,"finalized_at": string | null,"finalized_by": string | null,"id": string,"opened_at": string,"opened_by": string | null,"opened_late": boolean,"qr_secret": string,"status": string
                  }
                  Insert: {
                    "closed_at"?: string | null,"closed_by"?: string | null,"created_at"?: string,"event_date_id": string,"event_id": string,"finalized_at"?: string | null,"finalized_by"?: string | null,"id"?: string,"opened_at"?: string,"opened_by"?: string | null,"opened_late"?: boolean,"qr_secret"?: string,"status"?: string
                  }
                  Update: {
                    "closed_at"?: string | null,"closed_by"?: string | null,"created_at"?: string,"event_date_id"?: string,"event_id"?: string,"finalized_at"?: string | null,"finalized_by"?: string | null,"id"?: string,"opened_at"?: string,"opened_by"?: string | null,"opened_late"?: boolean,"qr_secret"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "attendance_sessions_closed_by_fkey"
      columns: ["closed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_sessions_event_date_id_fkey"
      columns: ["event_date_id"]
isOneToOne: true
      referencedRelation: "event_dates"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_sessions_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_sessions_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "public_events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_sessions_finalized_by_fkey"
      columns: ["finalized_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attendance_sessions_opened_by_fkey"
      columns: ["opened_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"audit_logs": {
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
                },"certificates": {
                  Row: {
                    "attempt_count": number,"attendance_percent": number,"delivery_status": string,"error_code": string | null,"event_id": string,"id": string,"issued_at": string,"last_attempt_at": string | null,"pdf_path": string | null,"recipient_email": string,"recipient_name": string,"registration_id": string,"sent_at": string | null,"sessions_attended": number,"sessions_expected": number,"user_id": string | null
                  }
                  Insert: {
                    "attempt_count"?: number,"attendance_percent": number,"delivery_status"?: string,"error_code"?: string | null,"event_id": string,"id"?: string,"issued_at"?: string,"last_attempt_at"?: string | null,"pdf_path"?: string | null,"recipient_email": string,"recipient_name": string,"registration_id": string,"sent_at"?: string | null,"sessions_attended": number,"sessions_expected": number,"user_id"?: string | null
                  }
                  Update: {
                    "attempt_count"?: number,"attendance_percent"?: number,"delivery_status"?: string,"error_code"?: string | null,"event_id"?: string,"id"?: string,"issued_at"?: string,"last_attempt_at"?: string | null,"pdf_path"?: string | null,"recipient_email"?: string,"recipient_name"?: string,"registration_id"?: string,"sent_at"?: string | null,"sessions_attended"?: number,"sessions_expected"?: number,"user_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "certificates_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificates_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "public_events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificates_registration_id_fkey"
      columns: ["registration_id"]
isOneToOne: true
      referencedRelation: "event_registrations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificates_registration_id_fkey"
      columns: ["registration_id"]
isOneToOne: true
      referencedRelation: "my_registrations"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "certificates_user_id_fkey"
      columns: ["user_id"]
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
                },"email_logs": {
                  Row: {
                    "attempt": number,"created_at": string,"entity_id": string | null,"entity_type": string | null,"error_code": string | null,"error_message": string | null,"id": string,"idempotency_key": string,"locale": string,"provider": string | null,"provider_message_id": string | null,"recipient_email": string,"recipient_user_id": string | null,"status": string,"template_key": string
                  }
                  Insert: {
                    "attempt"?: number,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string | null,"error_code"?: string | null,"error_message"?: string | null,"id"?: string,"idempotency_key": string,"locale": string,"provider"?: string | null,"provider_message_id"?: string | null,"recipient_email": string,"recipient_user_id"?: string | null,"status": string,"template_key": string
                  }
                  Update: {
                    "attempt"?: number,"created_at"?: string,"entity_id"?: string | null,"entity_type"?: string | null,"error_code"?: string | null,"error_message"?: string | null,"id"?: string,"idempotency_key"?: string,"locale"?: string,"provider"?: string | null,"provider_message_id"?: string | null,"recipient_email"?: string,"recipient_user_id"?: string | null,"status"?: string,"template_key"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "email_logs_recipient_user_id_fkey"
      columns: ["recipient_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"event_dates": {
                  Row: {
                    "ends_at": string | null,"event_date": string,"event_id": string,"id": string,"starts_at": string | null
                  }
                  Insert: {
                    "ends_at"?: string | null,"event_date": string,"event_id": string,"id"?: string,"starts_at"?: string | null
                  }
                  Update: {
                    "ends_at"?: string | null,"event_date"?: string,"event_id"?: string,"id"?: string,"starts_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_dates_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_dates_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "public_events"
      referencedColumns: ["id"]
    }
                  ]
                },"event_presenters": {
                  Row: {
                    "event_id": string,"guest_link": string | null,"guest_name_ar": string | null,"guest_name_en": string | null,"guest_photo_path": string | null,"guest_title_ar": string | null,"guest_title_en": string | null,"id": string,"profile_id": string | null,"role": string,"sort_order": number
                  }
                  Insert: {
                    "event_id": string,"guest_link"?: string | null,"guest_name_ar"?: string | null,"guest_name_en"?: string | null,"guest_photo_path"?: string | null,"guest_title_ar"?: string | null,"guest_title_en"?: string | null,"id"?: string,"profile_id"?: string | null,"role"?: string,"sort_order"?: number
                  }
                  Update: {
                    "event_id"?: string,"guest_link"?: string | null,"guest_name_ar"?: string | null,"guest_name_en"?: string | null,"guest_photo_path"?: string | null,"guest_title_ar"?: string | null,"guest_title_en"?: string | null,"id"?: string,"profile_id"?: string | null,"role"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_presenters_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_presenters_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "public_events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_presenters_profile_id_fkey"
      columns: ["profile_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"event_private_details": {
                  Row: {
                    "event_id": string,"group_link": string | null,"meeting_notes": string | null,"meeting_url": string | null,"organizer_notes": string | null,"updated_at": string
                  }
                  Insert: {
                    "event_id": string,"group_link"?: string | null,"meeting_notes"?: string | null,"meeting_url"?: string | null,"organizer_notes"?: string | null,"updated_at"?: string
                  }
                  Update: {
                    "event_id"?: string,"group_link"?: string | null,"meeting_notes"?: string | null,"meeting_url"?: string | null,"organizer_notes"?: string | null,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_private_details_event_id_fkey"
      columns: ["event_id"]
isOneToOne: true
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_private_details_event_id_fkey"
      columns: ["event_id"]
isOneToOne: true
      referencedRelation: "public_events"
      referencedColumns: ["id"]
    }
                  ]
                },"event_registrations": {
                  Row: {
                    "answers": NonNullable<Json>,"attendance_percent": number | null,"attendance_result": string | null,"cancelled_at": string | null,"cancelled_by": string | null,"created_at": string,"decided_at": string | null,"decided_by": string | null,"decision_note": string | null,"email_snapshot": string,"event_id": string,"full_name_snapshot": string,"id": string,"legacy_id": number | null,"notify_status": string,"status": string,"updated_at": string,"user_id": string | null,"was_member": boolean
                  }
                  Insert: {
                    "answers"?: NonNullable<Json>,"attendance_percent"?: number | null,"attendance_result"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"decision_note"?: string | null,"email_snapshot": string,"event_id": string,"full_name_snapshot": string,"id"?: string,"legacy_id"?: number | null,"notify_status"?: string,"status"?: string,"updated_at"?: string,"user_id"?: string | null,"was_member"?: boolean
                  }
                  Update: {
                    "answers"?: NonNullable<Json>,"attendance_percent"?: number | null,"attendance_result"?: string | null,"cancelled_at"?: string | null,"cancelled_by"?: string | null,"created_at"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"decision_note"?: string | null,"email_snapshot"?: string,"event_id"?: string,"full_name_snapshot"?: string,"id"?: string,"legacy_id"?: number | null,"notify_status"?: string,"status"?: string,"updated_at"?: string,"user_id"?: string | null,"was_member"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_registrations_cancelled_by_fkey"
      columns: ["cancelled_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_registrations_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_registrations_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_registrations_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "public_events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_registrations_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"event_registrations_legacy": {
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
                },"events": {
                  Row: {
                    "archived_at": string | null,"attendance_finalized_at": string | null,"attendance_finalized_by": string | null,"audience": string,"awards_ar": string | null,"awards_en": string | null,"cancel_reason": string | null,"cancelled_at": string | null,"certificate_available": boolean,"committee_id": string,"completed_at": string | null,"contact_email": string | null,"contact_phone": string | null,"cover_image_path": string | null,"created_at": string,"created_by": string | null,"description_ar": string | null,"description_en": string | null,"details": NonNullable<Json>,"display_config": NonNullable<Json>,"end_date": string | null,"end_time": string | null,"faq": NonNullable<Json>,"goals": NonNullable<Json>,"id": string,"legacy_id": number | null,"location_ar": string | null,"location_en": string | null,"location_mode": string,"map_url": string | null,"published_at": string | null,"registration_end_at": string | null,"registration_start_at": string | null,"requires_approval": boolean,"review_note": string | null,"reviewed_at": string | null,"reviewed_by": string | null,"schedule_type": string,"seats": number | null,"slug": string,"start_date": string | null,"start_time": string | null,"status": string,"submission_note": string | null,"submitted_at": string | null,"submitted_by": string | null,"summary_ar": string | null,"summary_en": string | null,"title_ar": string,"title_en": string | null,"type": string,"updated_at": string,"waitlist_enabled": boolean
                  }
                  Insert: {
                    "archived_at"?: string | null,"attendance_finalized_at"?: string | null,"attendance_finalized_by"?: string | null,"audience"?: string,"awards_ar"?: string | null,"awards_en"?: string | null,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"certificate_available"?: boolean,"committee_id": string,"completed_at"?: string | null,"contact_email"?: string | null,"contact_phone"?: string | null,"cover_image_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"description_ar"?: string | null,"description_en"?: string | null,"details"?: NonNullable<Json>,"display_config"?: NonNullable<Json>,"end_date"?: string | null,"end_time"?: string | null,"faq"?: NonNullable<Json>,"goals"?: NonNullable<Json>,"id"?: string,"legacy_id"?: number | null,"location_ar"?: string | null,"location_en"?: string | null,"location_mode"?: string,"map_url"?: string | null,"published_at"?: string | null,"registration_end_at"?: string | null,"registration_start_at"?: string | null,"requires_approval"?: boolean,"review_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"schedule_type"?: string,"seats"?: number | null,"slug": string,"start_date"?: string | null,"start_time"?: string | null,"status"?: string,"submission_note"?: string | null,"submitted_at"?: string | null,"submitted_by"?: string | null,"summary_ar"?: string | null,"summary_en"?: string | null,"title_ar": string,"title_en"?: string | null,"type": string,"updated_at"?: string,"waitlist_enabled"?: boolean
                  }
                  Update: {
                    "archived_at"?: string | null,"attendance_finalized_at"?: string | null,"attendance_finalized_by"?: string | null,"audience"?: string,"awards_ar"?: string | null,"awards_en"?: string | null,"cancel_reason"?: string | null,"cancelled_at"?: string | null,"certificate_available"?: boolean,"committee_id"?: string,"completed_at"?: string | null,"contact_email"?: string | null,"contact_phone"?: string | null,"cover_image_path"?: string | null,"created_at"?: string,"created_by"?: string | null,"description_ar"?: string | null,"description_en"?: string | null,"details"?: NonNullable<Json>,"display_config"?: NonNullable<Json>,"end_date"?: string | null,"end_time"?: string | null,"faq"?: NonNullable<Json>,"goals"?: NonNullable<Json>,"id"?: string,"legacy_id"?: number | null,"location_ar"?: string | null,"location_en"?: string | null,"location_mode"?: string,"map_url"?: string | null,"published_at"?: string | null,"registration_end_at"?: string | null,"registration_start_at"?: string | null,"requires_approval"?: boolean,"review_note"?: string | null,"reviewed_at"?: string | null,"reviewed_by"?: string | null,"schedule_type"?: string,"seats"?: number | null,"slug"?: string,"start_date"?: string | null,"start_time"?: string | null,"status"?: string,"submission_note"?: string | null,"submitted_at"?: string | null,"submitted_by"?: string | null,"summary_ar"?: string | null,"summary_en"?: string | null,"title_ar"?: string,"title_en"?: string | null,"type"?: string,"updated_at"?: string,"waitlist_enabled"?: boolean
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_attendance_finalized_by_fkey"
      columns: ["attendance_finalized_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "committees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "current_positions"
      referencedColumns: ["committee_id"]
    },{
      foreignKeyName: "events_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_reviewed_by_fkey"
      columns: ["reviewed_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_submitted_by_fkey"
      columns: ["submitted_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"majors": {
                  Row: {
                    "id": number,"is_active": boolean,"name_ar": string,"name_en": string | null,"parent_id": number | null
                  }
                  Insert: {
                    "id"?: never,"is_active"?: boolean,"name_ar": string,"name_en"?: string | null,"parent_id"?: number | null
                  }
                  Update: {
                    "id"?: never,"is_active"?: boolean,"name_ar"?: string,"name_en"?: string | null,"parent_id"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "majors_parent_id_fkey"
      columns: ["parent_id"]
isOneToOne: false
      referencedRelation: "majors"
      referencedColumns: ["id"]
    }
                  ]
                },"member_claim_tokens": {
                  Row: {
                    "created_at": string,"created_by": string | null,"email": string,"expires_at": string,"id": string,"member_id": string,"token_hash": string,"used_at": string | null
                  }
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"email": string,"expires_at": string,"id"?: string,"member_id": string,"token_hash": string,"used_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"email"?: string,"expires_at"?: string,"id"?: string,"member_id"?: string,"token_hash"?: string,"used_at"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "member_claim_tokens_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "member_claim_tokens_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "member_directory"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "member_claim_tokens_member_id_fkey"
      columns: ["member_id"]
isOneToOne: false
      referencedRelation: "members"
      referencedColumns: ["id"]
    }
                  ]
                },"members": {
                  Row: {
                    "academic_status": string | null,"application_id": string | null,"bio_ar": string | null,"bio_en": string | null,"created_at": string,"ended_at": string | null,"first_name_ar": string,"first_name_en": string | null,"github_url": string | null,"id": string,"is_directory_visible": boolean,"joined_at": string,"joined_cycle_id": string | null,"joined_via": string,"last_name_ar": string,"last_name_en": string | null,"legacy_claim_email": string | null,"legacy_id": number | null,"linkedin_url": string | null,"major_id": number | null,"portfolio_url": string | null,"status": string,"status_reason": string | null,"sub_major_id": number | null,"track_id": number | null,"university_id": number | null,"updated_at": string,"user_id": string | null,"x_url": string | null
                  }
                  Insert: {
                    "academic_status"?: string | null,"application_id"?: string | null,"bio_ar"?: string | null,"bio_en"?: string | null,"created_at"?: string,"ended_at"?: string | null,"first_name_ar": string,"first_name_en"?: string | null,"github_url"?: string | null,"id"?: string,"is_directory_visible"?: boolean,"joined_at"?: string,"joined_cycle_id"?: string | null,"joined_via": string,"last_name_ar"?: string,"last_name_en"?: string | null,"legacy_claim_email"?: string | null,"legacy_id"?: number | null,"linkedin_url"?: string | null,"major_id"?: number | null,"portfolio_url"?: string | null,"status"?: string,"status_reason"?: string | null,"sub_major_id"?: number | null,"track_id"?: number | null,"university_id"?: number | null,"updated_at"?: string,"user_id"?: string | null,"x_url"?: string | null
                  }
                  Update: {
                    "academic_status"?: string | null,"application_id"?: string | null,"bio_ar"?: string | null,"bio_en"?: string | null,"created_at"?: string,"ended_at"?: string | null,"first_name_ar"?: string,"first_name_en"?: string | null,"github_url"?: string | null,"id"?: string,"is_directory_visible"?: boolean,"joined_at"?: string,"joined_cycle_id"?: string | null,"joined_via"?: string,"last_name_ar"?: string,"last_name_en"?: string | null,"legacy_claim_email"?: string | null,"legacy_id"?: number | null,"linkedin_url"?: string | null,"major_id"?: number | null,"portfolio_url"?: string | null,"status"?: string,"status_reason"?: string | null,"sub_major_id"?: number | null,"track_id"?: number | null,"university_id"?: number | null,"updated_at"?: string,"user_id"?: string | null,"x_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "members_application_id_fkey"
      columns: ["application_id"]
isOneToOne: true
      referencedRelation: "membership_applications"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "members_application_id_fkey"
      columns: ["application_id"]
isOneToOne: true
      referencedRelation: "membership_review_queue"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "members_application_id_fkey"
      columns: ["application_id"]
isOneToOne: true
      referencedRelation: "my_membership_application"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "members_joined_cycle_id_fkey"
      columns: ["joined_cycle_id"]
isOneToOne: false
      referencedRelation: "membership_cycle_phase"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "members_joined_cycle_id_fkey"
      columns: ["joined_cycle_id"]
isOneToOne: false
      referencedRelation: "membership_cycles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "members_major_id_fkey"
      columns: ["major_id"]
isOneToOne: false
      referencedRelation: "majors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "members_sub_major_id_fkey"
      columns: ["sub_major_id"]
isOneToOne: false
      referencedRelation: "majors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "members_track_id_fkey"
      columns: ["track_id"]
isOneToOne: false
      referencedRelation: "tracks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "members_university_id_fkey"
      columns: ["university_id"]
isOneToOne: false
      referencedRelation: "universities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "members_user_id_fkey"
      columns: ["user_id"]
isOneToOne: true
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"members_legacy": {
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
                },"membership_applications": {
                  Row: {
                    "academic_status": string,"answers": NonNullable<Json>,"bio_ar": string | null,"bio_en": string | null,"consent_at": string,"consent_version": string,"created_at": string,"cycle_id": string,"decided_at": string | null,"decided_by": string | null,"decision_note": string | null,"full_name_ar": string,"full_name_en": string | null,"github_url": string | null,"id": string,"linkedin_url": string | null,"major_id": number | null,"phone": string | null,"portfolio_url": string | null,"preferred_committee_id": string | null,"reviewer_id": string | null,"status": string,"sub_major_id": number | null,"submitted_at": string,"track_id": number | null,"university_id": number | null,"updated_at": string,"user_id": string,"wants_directory_listing": boolean,"withdrawn_at": string | null,"x_url": string | null
                  }
                  Insert: {
                    "academic_status": string,"answers"?: NonNullable<Json>,"bio_ar"?: string | null,"bio_en"?: string | null,"consent_at"?: string,"consent_version": string,"created_at"?: string,"cycle_id": string,"decided_at"?: string | null,"decided_by"?: string | null,"decision_note"?: string | null,"full_name_ar": string,"full_name_en"?: string | null,"github_url"?: string | null,"id"?: string,"linkedin_url"?: string | null,"major_id"?: number | null,"phone"?: string | null,"portfolio_url"?: string | null,"preferred_committee_id"?: string | null,"reviewer_id"?: string | null,"status"?: string,"sub_major_id"?: number | null,"submitted_at"?: string,"track_id"?: number | null,"university_id"?: number | null,"updated_at"?: string,"user_id": string,"wants_directory_listing"?: boolean,"withdrawn_at"?: string | null,"x_url"?: string | null
                  }
                  Update: {
                    "academic_status"?: string,"answers"?: NonNullable<Json>,"bio_ar"?: string | null,"bio_en"?: string | null,"consent_at"?: string,"consent_version"?: string,"created_at"?: string,"cycle_id"?: string,"decided_at"?: string | null,"decided_by"?: string | null,"decision_note"?: string | null,"full_name_ar"?: string,"full_name_en"?: string | null,"github_url"?: string | null,"id"?: string,"linkedin_url"?: string | null,"major_id"?: number | null,"phone"?: string | null,"portfolio_url"?: string | null,"preferred_committee_id"?: string | null,"reviewer_id"?: string | null,"status"?: string,"sub_major_id"?: number | null,"submitted_at"?: string,"track_id"?: number | null,"university_id"?: number | null,"updated_at"?: string,"user_id"?: string,"wants_directory_listing"?: boolean,"withdrawn_at"?: string | null,"x_url"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "membership_applications_cycle_id_fkey"
      columns: ["cycle_id"]
isOneToOne: false
      referencedRelation: "membership_cycle_phase"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_cycle_id_fkey"
      columns: ["cycle_id"]
isOneToOne: false
      referencedRelation: "membership_cycles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_major_id_fkey"
      columns: ["major_id"]
isOneToOne: false
      referencedRelation: "majors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_preferred_committee_id_fkey"
      columns: ["preferred_committee_id"]
isOneToOne: false
      referencedRelation: "committees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_preferred_committee_id_fkey"
      columns: ["preferred_committee_id"]
isOneToOne: false
      referencedRelation: "current_positions"
      referencedColumns: ["committee_id"]
    },{
      foreignKeyName: "membership_applications_reviewer_id_fkey"
      columns: ["reviewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_sub_major_id_fkey"
      columns: ["sub_major_id"]
isOneToOne: false
      referencedRelation: "majors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_track_id_fkey"
      columns: ["track_id"]
isOneToOne: false
      referencedRelation: "tracks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_university_id_fkey"
      columns: ["university_id"]
isOneToOne: false
      referencedRelation: "universities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"membership_cycles": {
                  Row: {
                    "capacity": number | null,"closed_early_at": string | null,"closes_at": string,"created_at": string,"created_by": string | null,"description_ar": string | null,"description_en": string | null,"id": string,"name_ar": string,"name_en": string | null,"opens_at": string,"questions": NonNullable<Json>,"review_ends_at": string | null,"status": string,"updated_at": string
                  }
                  Insert: {
                    "capacity"?: number | null,"closed_early_at"?: string | null,"closes_at": string,"created_at"?: string,"created_by"?: string | null,"description_ar"?: string | null,"description_en"?: string | null,"id"?: string,"name_ar": string,"name_en"?: string | null,"opens_at": string,"questions"?: NonNullable<Json>,"review_ends_at"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Update: {
                    "capacity"?: number | null,"closed_early_at"?: string | null,"closes_at"?: string,"created_at"?: string,"created_by"?: string | null,"description_ar"?: string | null,"description_en"?: string | null,"id"?: string,"name_ar"?: string,"name_en"?: string | null,"opens_at"?: string,"questions"?: NonNullable<Json>,"review_ends_at"?: string | null,"status"?: string,"updated_at"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "membership_cycles_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
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
                },"site_settings": {
                  Row: {
                    "is_public": boolean,"key": string,"updated_at": string,"updated_by": string | null,"value": NonNullable<Json>
                  }
                  Insert: {
                    "is_public"?: boolean,"key": string,"updated_at"?: string,"updated_by"?: string | null,"value": NonNullable<Json>
                  }
                  Update: {
                    "is_public"?: boolean,"key"?: string,"updated_at"?: string,"updated_by"?: string | null,"value"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_settings_updated_by_fkey"
      columns: ["updated_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"tags": {
                  Row: {
                    "created_at": string,"id": string,"label_ar": string,"label_en": string | null,"slug": string
                  }
                  Insert: {
                    "created_at"?: string,"id"?: string,"label_ar": string,"label_en"?: string | null,"slug": string
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"label_ar"?: string,"label_en"?: string | null,"slug"?: string
                  }
                  Relationships: [
                    
                  ]
                },"tracks": {
                  Row: {
                    "display_order": number,"id": number,"is_active": boolean,"name_ar": string,"name_en": string | null
                  }
                  Insert: {
                    "display_order"?: number,"id"?: never,"is_active"?: boolean,"name_ar": string,"name_en"?: string | null
                  }
                  Update: {
                    "display_order"?: number,"id"?: never,"is_active"?: boolean,"name_ar"?: string,"name_en"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"universities": {
                  Row: {
                    "display_order": number,"id": number,"is_active": boolean,"name_ar": string,"name_en": string | null
                  }
                  Insert: {
                    "display_order"?: number,"id"?: never,"is_active"?: boolean,"name_ar": string,"name_en"?: string | null
                  }
                  Update: {
                    "display_order"?: number,"id"?: never,"is_active"?: boolean,"name_ar"?: string,"name_en"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            "admin_email_logs": {
                  Row: {
                    "attempt": number | null,"created_at": string | null,"entity_id": string | null,"entity_type": string | null,"error_code": string | null,"error_message": string | null,"id": string | null,"locale": string | null,"provider": string | null,"recipient_email": string | null,"state": string | null,"status": string | null,"template_key": string | null
                  }
                  Insert: {
                           "attempt"?: number | null,"created_at"?: string | null,"entity_id"?: string | null,"entity_type"?: string | null,"error_code"?: string | null,"error_message"?: string | null,"id"?: string | null,"locale"?: string | null,"provider"?: string | null,"recipient_email"?: string | null,"state"?: never,"status"?: string | null,"template_key"?: string | null
                         }
                        Update: {
                           "attempt"?: number | null,"created_at"?: string | null,"entity_id"?: string | null,"entity_type"?: string | null,"error_code"?: string | null,"error_message"?: string | null,"id"?: string | null,"locale"?: string | null,"provider"?: string | null,"recipient_email"?: string | null,"state"?: never,"status"?: string | null,"template_key"?: string | null
                         }
                        Relationships: [
                    
                  ]
                },"article_authors_named": {
                  Row: {
                    "article_id": string | null,"committee_id": string | null,"display_name_ar": string | null,"display_name_en": string | null,"label_ar": string | null,"label_en": string | null,"position": number | null,"user_id": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "article_authors_article_id_fkey"
      columns: ["article_id"]
isOneToOne: false
      referencedRelation: "articles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "article_authors_article_id_fkey"
      columns: ["article_id"]
isOneToOne: false
      referencedRelation: "dashboard_articles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "article_authors_article_id_fkey"
      columns: ["article_id"]
isOneToOne: false
      referencedRelation: "public_articles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "article_authors_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "committees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "article_authors_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "current_positions"
      referencedColumns: ["committee_id"]
    },{
      foreignKeyName: "article_authors_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"article_status_counts": {
                  Row: {
                    "status": string | null,"total": number | null
                  }
                  Relationships: [
                    
                  ]
                },"current_positions": {
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
                },"dashboard_articles": {
                  Row: {
                    "author_names_ar": Json | null,"author_names_en": Json | null,"committee_id": string | null,"committee_name_ar": string | null,"committee_name_en": string | null,"created_by": string | null,"id": string | null,"published_at": string | null,"reading_minutes": number | null,"review_note": string | null,"slug": string | null,"status": string | null,"submitted_at": string | null,"tag_count": number | null,"title_ar": string | null,"title_en": string | null,"updated_at": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "articles_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "committees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "articles_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "current_positions"
      referencedColumns: ["committee_id"]
    },{
      foreignKeyName: "articles_created_by_fkey"
      columns: ["created_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"event_registration_counts": {
                  Row: {
                    "event_id": string | null,"status": string | null,"total": number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_registrations_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_registrations_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "public_events"
      referencedColumns: ["id"]
    }
                  ]
                },"event_status_counts": {
                  Row: {
                    "status": string | null,"total": number | null
                  }
                  Relationships: [
                    
                  ]
                },"member_directory": {
                  Row: {
                    "bio": string | null,"bio_en": string | null,"first_name": string | null,"first_name_en": string | null,"github_url": string | null,"id": string | null,"joined_at": string | null,"last_name": string | null,"last_name_en": string | null,"legacy_id": number | null,"linkedin_url": string | null,"major": string | null,"major_en": string | null,"portfolio_url": string | null,"status": string | null,"status_en": string | null,"sub_major": string | null,"sub_major_en": string | null,"track": string | null,"track_en": string | null,"university": string | null,"university_en": string | null,"x_url": string | null
                  }
                  Relationships: [
                    
                  ]
                },"membership_cycle_counts": {
                  Row: {
                    "cycle_id": string | null,"status": string | null,"total": number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "membership_applications_cycle_id_fkey"
      columns: ["cycle_id"]
isOneToOne: false
      referencedRelation: "membership_cycle_phase"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_cycle_id_fkey"
      columns: ["cycle_id"]
isOneToOne: false
      referencedRelation: "membership_cycles"
      referencedColumns: ["id"]
    }
                  ]
                },"membership_cycle_phase": {
                  Row: {
                    "closed_early_at": string | null,"closes_at": string | null,"description_ar": string | null,"description_en": string | null,"effective_closes_at": string | null,"id": string | null,"name_ar": string | null,"name_en": string | null,"opens_at": string | null,"phase": string | null,"questions": Json | null,"status": string | null
                  }
                  Insert: {
                           "closed_early_at"?: string | null,"closes_at"?: string | null,"description_ar"?: string | null,"description_en"?: string | null,"effective_closes_at"?: never,"id"?: string | null,"name_ar"?: string | null,"name_en"?: string | null,"opens_at"?: string | null,"phase"?: never,"questions"?: Json | null,"status"?: string | null
                         }
                        Update: {
                           "closed_early_at"?: string | null,"closes_at"?: string | null,"description_ar"?: string | null,"description_en"?: string | null,"effective_closes_at"?: never,"id"?: string | null,"name_ar"?: string | null,"name_en"?: string | null,"opens_at"?: string | null,"phase"?: never,"questions"?: Json | null,"status"?: string | null
                         }
                        Relationships: [
                    
                  ]
                },"membership_review_queue": {
                  Row: {
                    "academic_status": string | null,"cycle_id": string | null,"decided_at": string | null,"decision_note": string | null,"email": string | null,"full_name_ar": string | null,"full_name_en": string | null,"id": string | null,"major_id": number | null,"preferred_committee_id": string | null,"reviewer_id": string | null,"status": string | null,"submitted_at": string | null,"track_id": number | null,"university_id": number | null,"user_id": string | null,"wants_directory_listing": boolean | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "membership_applications_cycle_id_fkey"
      columns: ["cycle_id"]
isOneToOne: false
      referencedRelation: "membership_cycle_phase"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_cycle_id_fkey"
      columns: ["cycle_id"]
isOneToOne: false
      referencedRelation: "membership_cycles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_major_id_fkey"
      columns: ["major_id"]
isOneToOne: false
      referencedRelation: "majors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_preferred_committee_id_fkey"
      columns: ["preferred_committee_id"]
isOneToOne: false
      referencedRelation: "committees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_preferred_committee_id_fkey"
      columns: ["preferred_committee_id"]
isOneToOne: false
      referencedRelation: "current_positions"
      referencedColumns: ["committee_id"]
    },{
      foreignKeyName: "membership_applications_reviewer_id_fkey"
      columns: ["reviewer_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_track_id_fkey"
      columns: ["track_id"]
isOneToOne: false
      referencedRelation: "tracks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_university_id_fkey"
      columns: ["university_id"]
isOneToOne: false
      referencedRelation: "universities"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"my_membership_application": {
                  Row: {
                    "academic_status": string | null,"answers": Json | null,"bio_ar": string | null,"bio_en": string | null,"cycle_id": string | null,"decided_at": string | null,"full_name_ar": string | null,"full_name_en": string | null,"github_url": string | null,"id": string | null,"linkedin_url": string | null,"major_id": number | null,"phone": string | null,"portfolio_url": string | null,"preferred_committee_id": string | null,"status": string | null,"sub_major_id": number | null,"submitted_at": string | null,"track_id": number | null,"university_id": number | null,"updated_at": string | null,"wants_directory_listing": boolean | null,"withdrawn_at": string | null,"x_url": string | null
                  }
                  Insert: {
                           "academic_status"?: string | null,"answers"?: Json | null,"bio_ar"?: string | null,"bio_en"?: string | null,"cycle_id"?: string | null,"decided_at"?: string | null,"full_name_ar"?: string | null,"full_name_en"?: string | null,"github_url"?: string | null,"id"?: string | null,"linkedin_url"?: string | null,"major_id"?: number | null,"phone"?: string | null,"portfolio_url"?: string | null,"preferred_committee_id"?: string | null,"status"?: string | null,"sub_major_id"?: number | null,"submitted_at"?: string | null,"track_id"?: number | null,"university_id"?: number | null,"updated_at"?: string | null,"wants_directory_listing"?: boolean | null,"withdrawn_at"?: string | null,"x_url"?: string | null
                         }
                        Update: {
                           "academic_status"?: string | null,"answers"?: Json | null,"bio_ar"?: string | null,"bio_en"?: string | null,"cycle_id"?: string | null,"decided_at"?: string | null,"full_name_ar"?: string | null,"full_name_en"?: string | null,"github_url"?: string | null,"id"?: string | null,"linkedin_url"?: string | null,"major_id"?: number | null,"phone"?: string | null,"portfolio_url"?: string | null,"preferred_committee_id"?: string | null,"status"?: string | null,"sub_major_id"?: number | null,"submitted_at"?: string | null,"track_id"?: number | null,"university_id"?: number | null,"updated_at"?: string | null,"wants_directory_listing"?: boolean | null,"withdrawn_at"?: string | null,"x_url"?: string | null
                         }
                        Relationships: [
                    {
      foreignKeyName: "membership_applications_cycle_id_fkey"
      columns: ["cycle_id"]
isOneToOne: false
      referencedRelation: "membership_cycle_phase"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_cycle_id_fkey"
      columns: ["cycle_id"]
isOneToOne: false
      referencedRelation: "membership_cycles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_major_id_fkey"
      columns: ["major_id"]
isOneToOne: false
      referencedRelation: "majors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_preferred_committee_id_fkey"
      columns: ["preferred_committee_id"]
isOneToOne: false
      referencedRelation: "committees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_preferred_committee_id_fkey"
      columns: ["preferred_committee_id"]
isOneToOne: false
      referencedRelation: "current_positions"
      referencedColumns: ["committee_id"]
    },{
      foreignKeyName: "membership_applications_sub_major_id_fkey"
      columns: ["sub_major_id"]
isOneToOne: false
      referencedRelation: "majors"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_track_id_fkey"
      columns: ["track_id"]
isOneToOne: false
      referencedRelation: "tracks"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_applications_university_id_fkey"
      columns: ["university_id"]
isOneToOne: false
      referencedRelation: "universities"
      referencedColumns: ["id"]
    }
                  ]
                },"my_registrations": {
                  Row: {
                    "attendance_percent": number | null,"attendance_result": string | null,"cancelled_at": string | null,"certificate_id": string | null,"cover_image_path": string | null,"created_at": string | null,"decided_at": string | null,"end_date": string | null,"event_id": string | null,"event_status": string | null,"group_link": string | null,"id": string | null,"location_ar": string | null,"location_en": string | null,"location_mode": string | null,"meeting_notes": string | null,"meeting_url": string | null,"slug": string | null,"start_date": string | null,"start_time": string | null,"status": string | null,"title_ar": string | null,"title_en": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "event_registrations_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "events"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "event_registrations_event_id_fkey"
      columns: ["event_id"]
isOneToOne: false
      referencedRelation: "public_events"
      referencedColumns: ["id"]
    }
                  ]
                },"public_articles": {
                  Row: {
                    "authors": Json | null,"body_ar": string | null,"body_en": string | null,"committee_id": string | null,"committee_name_ar": string | null,"committee_name_en": string | null,"committee_slug": string | null,"cover_image_path": string | null,"display_rank": number | null,"excerpt_ar": string | null,"excerpt_en": string | null,"id": string | null,"legacy_id": number | null,"published_at": string | null,"reading_minutes": number | null,"resource_label_ar": string | null,"resource_label_en": string | null,"resource_url": string | null,"slug": string | null,"tags": Json | null,"title_ar": string | null,"title_en": string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "articles_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "committees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "articles_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "current_positions"
      referencedColumns: ["committee_id"]
    }
                  ]
                },"public_events": {
                  Row: {
                    "accepted_count": number | null,"audience": string | null,"awards_ar": string | null,"awards_en": string | null,"cancel_reason": string | null,"cancelled_at": string | null,"certificate_available": boolean | null,"committee_id": string | null,"committee_name_ar": string | null,"committee_name_en": string | null,"committee_slug": string | null,"contact_email": string | null,"contact_phone": string | null,"cover_image_path": string | null,"description_ar": string | null,"description_en": string | null,"details": Json | null,"display_config": Json | null,"end_date": string | null,"end_time": string | null,"faq": Json | null,"goals": Json | null,"id": string | null,"last_date": string | null,"legacy_id": number | null,"location_ar": string | null,"location_en": string | null,"location_mode": string | null,"map_url": string | null,"phase": string | null,"published_at": string | null,"registration_end_at": string | null,"registration_start_at": string | null,"requires_approval": boolean | null,"schedule_type": string | null,"seats": number | null,"seats_left": number | null,"slug": string | null,"start_date": string | null,"start_time": string | null,"status": string | null,"summary_ar": string | null,"summary_en": string | null,"title_ar": string | null,"title_en": string | null,"type": string | null,"waitlist_enabled": boolean | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "events_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "committees"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "events_committee_id_fkey"
      columns: ["committee_id"]
isOneToOne: false
      referencedRelation: "current_positions"
      referencedColumns: ["committee_id"]
    }
                  ]
                }
          }
          Functions: {
            "assign_role":
{ Args: { "p_bio_ar"?: string,"p_bio_en"?: string,"p_committee"?: string,"p_ends_at"?: string,"p_role": string,"p_starts_at"?: string,"p_tags_ar"?: (string)[],"p_tags_en"?: (string)[],"p_title_ar"?: string,"p_title_en"?: string,"p_user": string }; Returns: string
                           },
"cancel_registration":
{ Args: { "p_id": string }; Returns: undefined
                           },
"cancel_registration_by_organizer":
{ Args: { "p_id": string,"p_reason": string }; Returns: undefined
                           },
"check_in":
{ Args: { "p_session": string,"p_token"?: string }; Returns: string
                           },
"check_in_context":
{ Args: { "p_session"?: string,"p_slug": string }; Returns: Json
                           },
"claim_legacy_member":
{ Args: { "p_token": string }; Returns: string
                           },
"claim_membership_application":
{ Args: { "p_id": string,"p_release"?: boolean }; Returns: undefined
                           },
"close_session":
{ Args: { "p_session": string }; Returns: undefined
                           },
"committee_cards":
{ Args: Record<PropertyKey, never>; Returns: {
              "articles_count": number,"deputy_name_ar": string,"deputy_name_en": string,"display_order": number,"events_count": number,"head_name_ar": string,"head_name_en": string,"id": string,"members_count": number,"name_ar": string,"name_en": string,"slug": string,"status": string
            }[]
                           },
"committee_stats":
{ Args: { "p_committee": string,"p_from": string,"p_to": string }; Returns: Json
                           },
"community_stats":
{ Args: { "p_from": string,"p_to": string }; Returns: Json
                           },
"correct_attendance":
{ Args: { "p_present": boolean,"p_reason": string,"p_registration": string,"p_session": string }; Returns: undefined
                           },
"create_member_claim_token":
{ Args: { "p_email": string,"p_member": string }; Returns: string
                           },
"dashboard_summary":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"decide_membership_applications":
{ Args: { "p_decision": string,"p_ids": (string)[],"p_note"?: string }; Returns: Json
                           },
"decide_registrations":
{ Args: { "p_decision": string,"p_ids": (string)[],"p_note"?: string }; Returns: Json
                           },
"delete_article_draft":
{ Args: { "p_id": string }; Returns: undefined
                           },
"delete_committee":
{ Args: { "p_id": string }; Returns: undefined
                           },
"delete_event_draft":
{ Args: { "p_id": string }; Returns: undefined
                           },
"due_email_retries":
{ Args: { "p_limit"?: number }; Returns: {
              "attempt": number,"entity_id": string,"entity_type": string,"id": string,"template_key": string
            }[]
                           },
"end_role_assignment":
{ Args: { "p_ends_at"?: string,"p_id": string,"p_reason": string }; Returns: undefined
                           },
"event_attendance_overview":
{ Args: { "p_event": string }; Returns: Json
                           },
"event_history":
{ Args: { "p_id": string }; Returns: {
              "action": string,"actor_name": string,"occurred_at": string,"summary": Json
            }[]
                           },
"event_presenters_for":
{ Args: { "p_event": string }; Returns: {
              "id": string,"link": string,"name_ar": string,"name_en": string,"photo_path": string,"profile_id": string,"role": string,"sort_order": number,"title_ar": string,"title_en": string
            }[]
                           },
"finalize_event_attendance":
{ Args: { "p_event": string }; Returns: Json
                           },
"finalize_session":
{ Args: { "p_session": string }; Returns: Json
                           },
"handover_head":
{ Args: { "p_at"?: string,"p_committee": string,"p_new_head": string }; Returns: string
                           },
"issue_certificates":
{ Args: { "p_event": string }; Returns: Json
                           },
"my_activity":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"open_session":
{ Args: { "p_confirm"?: boolean,"p_event_date": string }; Returns: string
                           },
"pending_queues":
{ Args: Record<PropertyKey, never>; Returns: Json
                           },
"preview_member_claim":
{ Args: { "p_token": string }; Returns: Json
                           },
"record_attendance":
{ Args: { "p_present"?: boolean,"p_registrations": (string)[],"p_session": string }; Returns: number
                           },
"record_export":
{ Args: { "p_count": number,"p_kind": string }; Returns: undefined
                           },
"register_for_event":
{ Args: { "p_answers"?: Json,"p_event": string }; Returns: Json
                           },
"save_article":
{ Args: { "p": Json,"p_expected_updated_at"?: string,"p_id": string }; Returns: Json
                           },
"save_committee":
{ Args: { "p": Json,"p_id": string }; Returns: Json
                           },
"save_event":
{ Args: { "p": Json,"p_event_id": string,"p_expected_updated_at"?: string }; Returns: Json
                           },
"save_membership_cycle":
{ Args: { "p": Json,"p_id": string }; Returns: Json
                           },
"search_article_author_candidates":
{ Args: { "p_query": string }; Returns: {
              "full_name_ar": string,"full_name_en": string,"id": string
            }[]
                           },
"search_presenter_candidates":
{ Args: { "p_query": string }; Returns: {
              "full_name_ar": string,"full_name_en": string,"id": string
            }[]
                           },
"session_qr_token":
{ Args: { "p_session": string }; Returns: Json
                           },
"session_roster":
{ Args: { "p_session": string }; Returns: {
              "checked_in_at": string,"full_name": string,"method": string,"present": boolean,"registration_id": string,"was_member": boolean
            }[]
                           },
"set_committee_status":
{ Args: { "p_active": boolean,"p_id": string,"p_reason"?: string }; Returns: Json
                           },
"set_member_status":
{ Args: { "p_id": string,"p_reason"?: string,"p_status": string }; Returns: string
                           },
"submit_membership_application":
{ Args: { "p": Json,"p_cycle": string }; Returns: Json
                           },
"transition_article":
{ Args: { "p_action": string,"p_id": string,"p_note"?: string }; Returns: string
                           },
"transition_event":
{ Args: { "p_action": string,"p_id": string,"p_note"?: string }; Returns: string
                           },
"transition_membership_cycle":
{ Args: { "p_action": string,"p_closes_at"?: string,"p_id": string }; Returns: string
                           },
"update_membership_application":
{ Args: { "p": Json,"p_id": string }; Returns: undefined
                           },
"update_my_member_profile":
{ Args: { "p": Json }; Returns: undefined
                           },
"verify_certificate":
{ Args: { "p_id": string }; Returns: {
              "attendance_percent": number,"end_date": string,"issued_at": string,"recipient_name": string,"start_date": string,"title_ar": string,"title_en": string
            }[]
                           },
"withdraw_membership_application":
{ Args: { "p_id": string }; Returns: undefined
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
