import { supabase } from '@/integrations/supabase/client';
import { formatSupabaseError, logError } from '@/lib/errorHandler';

export interface AboutPageContent {
  id: string;
  title: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
}

export interface AboutPagePhoto {
  id: string;
  image_url: string;
  image_path: string;
  alignment: 'left' | 'center' | 'right';
  size: 'small' | 'medium' | 'large' | 'full';
  order_index: number;
  caption: string | null;
  created_at: string;
  updated_at: string;
}

const DEFAULT_CONTENT_ID = '00000000-0000-0000-0000-000000000002';

export const getAboutPageContent = async (): Promise<AboutPageContent | null> => {
  try {
    const { data, error } = await supabase
      .from('about_page_content')
      .select('*')
      .eq('id', DEFAULT_CONTENT_ID)
      .single();

    if (error) {
      logError('AboutPage', error, { operation: 'getAboutPageContent' });
      // PGRST116 means no row found - return null as this is a valid state (content not set yet)
      if (error.code === 'PGRST116') {
        return null;
      }
      // 42P01 means table doesn't exist - provide helpful error message
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        throw new Error(
          'The about_page_content table does not exist. Please run the migration: ' +
          'supabase/migrations/20251208120000_create_about_page.sql'
        );
      }
      throw new Error(formatSupabaseError(error));
    }

    return data;
  } catch (error) {
    logError('AboutPage', error, { operation: 'getAboutPageContent' });
    throw error instanceof Error ? error : new Error(formatSupabaseError(error));
  }
};

export const updateAboutPageContent = async (content: Partial<AboutPageContent>): Promise<boolean> => {
  try {
    // First, try to get existing content to see if row exists
    const { data: existing } = await supabase
      .from('about_page_content')
      .select('id')
      .eq('id', DEFAULT_CONTENT_ID)
      .single();

    const { error } = await supabase
      .from('about_page_content')
      .upsert({
        id: DEFAULT_CONTENT_ID,
        ...content,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      });

    if (error) {
      logError('AboutPage', error, { operation: 'updateAboutPageContent', content });
      throw new Error(formatSupabaseError(error));
    }

    return true;
  } catch (error: any) {
    logError('AboutPage', error, { operation: 'updateAboutPageContent', content });
    throw error instanceof Error ? error : new Error(formatSupabaseError(error));
  }
};

export const getAboutPagePhotos = async (): Promise<AboutPagePhoto[]> => {
  try {
    const { data, error } = await supabase
      .from('about_page_photos')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      logError('AboutPage', error, { operation: 'getAboutPagePhotos' });
      // 42P01 means table doesn't exist - provide helpful error message
      if (error.message?.includes('does not exist') || error.code === '42P01') {
        throw new Error(
          'The about_page_photos table does not exist. Please run the migration: ' +
          'supabase/migrations/20251208120000_create_about_page.sql'
        );
      }
      throw new Error(formatSupabaseError(error));
    }

    return data || [];
  } catch (error) {
    logError('AboutPage', error, { operation: 'getAboutPagePhotos' });
    throw error instanceof Error ? error : new Error(formatSupabaseError(error));
  }
};

export const uploadAboutPagePhoto = async (
  file: File,
  alignment: 'left' | 'center' | 'right',
  size: 'small' | 'medium' | 'large' | 'full',
  caption: string | null,
  orderIndex: number
): Promise<AboutPagePhoto> => {
  try {
    // Generate unique file path
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `about-page/${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('festival-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      logError('AboutPage', uploadError, { operation: 'uploadAboutPagePhoto', fileName: file.name });
      throw new Error(`Failed to upload image: ${formatSupabaseError(uploadError)}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('festival-images')
      .getPublicUrl(filePath);

    // Insert photo record
    const { data, error } = await supabase
      .from('about_page_photos')
      .insert({
        image_url: publicUrl,
        image_path: filePath,
        alignment,
        size,
        order_index: orderIndex,
        caption,
      })
      .select()
      .single();

    if (error) {
      logError('AboutPage', error, { operation: 'uploadAboutPagePhoto', filePath });
      throw new Error(`Failed to save photo record: ${formatSupabaseError(error)}`);
    }

    if (!data) {
      throw new Error('Photo record was not created');
    }

    return data;
  } catch (error) {
    logError('AboutPage', error, { operation: 'uploadAboutPagePhoto', fileName: file.name });
    throw error instanceof Error ? error : new Error(formatSupabaseError(error));
  }
};

export const updateAboutPagePhoto = async (
  id: string,
  updates: Partial<AboutPagePhoto>
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('about_page_photos')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      logError('AboutPage', error, { operation: 'updateAboutPagePhoto', id, updates });
      throw new Error(formatSupabaseError(error));
    }
  } catch (error) {
    logError('AboutPage', error, { operation: 'updateAboutPagePhoto', id, updates });
    throw error instanceof Error ? error : new Error(formatSupabaseError(error));
  }
};

export const deleteAboutPagePhoto = async (id: string, imagePath: string): Promise<void> => {
  try {
    // Delete from storage (non-critical, log but don't fail)
    const { error: storageError } = await supabase.storage
      .from('festival-images')
      .remove([imagePath]);

    if (storageError) {
      logError('AboutPage', storageError, { operation: 'deleteAboutPagePhoto', imagePath });
      // Don't throw - storage deletion failure shouldn't block DB deletion
    }

    // Delete from database
    const { error } = await supabase
      .from('about_page_photos')
      .delete()
      .eq('id', id);

    if (error) {
      logError('AboutPage', error, { operation: 'deleteAboutPagePhoto', id });
      throw new Error(formatSupabaseError(error));
    }
  } catch (error) {
    logError('AboutPage', error, { operation: 'deleteAboutPagePhoto', id, imagePath });
    throw error instanceof Error ? error : new Error(formatSupabaseError(error));
  }
};

