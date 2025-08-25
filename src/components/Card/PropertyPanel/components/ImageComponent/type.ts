export interface ImageData {
  img_url?: string;
  i18n_img_url?: {
    'en-US': string;
  };
  style?: {
    crop_mode?: 'default' | 'top' | 'center';
  };
}
