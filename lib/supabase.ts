import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';

const clean = (s: string) => s.replace(/[^\x21-\x7E]/g, '');

const supabaseUrl = clean('https://vwtowjxwsmwewvmvapnh.supabase.co');
const supabaseKey = clean('sb_publishable_uAHH5O0ciLf5OraEYK3g8Q_vGTgZOc-');

export const supabase = createClient(supabaseUrl, supabaseKey);