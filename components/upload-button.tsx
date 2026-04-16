'use client';

import { useState, useRef } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import axios from 'axios';
import { cn } from '@/lib/utils';

export function UploadButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<{ success?: boolean; message?: string; error?: string }>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    artist: '',
    album: '',
  });

  const resetForm = () => {
    setFormData({ name: '', artist: '', album: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    setStatus({});
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const audioFile = fileInputRef.current?.files?.[0];
    const imageFile = imageInputRef.current?.files?.[0];

    if (!audioFile) {
      setStatus({ error: 'Por favor selecciona un archivo de audio (.mp3)' });
      return;
    }

    setIsUploading(true);
    setStatus({});

    const data = new FormData();
    data.append('file', audioFile);
    if (imageFile) data.append('image', imageFile);
    data.append('name', formData.name);
    data.append('artist', formData.artist);
    data.append('album', formData.album);

    try {
      const response = await axios.post('/api/songs', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (response.data.success) {
        setStatus({ success: true, message: response.data.message });
        resetForm();
        
        // Dispatch custom event to refresh the list without reload (Senior Dynamic Listing requirement)
        window.dispatchEvent(new CustomEvent('refresh-songs'));
        
        setTimeout(() => setIsOpen(false), 2000);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const msg = error.response?.data?.error || 'Error al subir la canción';
      setStatus({ error: msg });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="w-full px-4 mb-4">
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="w-full justify-start space-x-2 bg-[#1A1A1A] border-[#282828] hover:bg-[#282828] text-[#d1d5db] text-xs h-9 transition-all"
      >
        <Upload className="w-4 h-4" />
        <span>Subir Canción</span>
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#181818] border border-[#282828] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-[#282828]">
              <h2 className="text-lg font-bold text-white">Añadir Nueva Canción</h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Archivo MP3 *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/mpeg"
                  required
                  className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white file:text-black hover:file:bg-gray-200 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Título</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Título de la canción"
                    className="w-full bg-[#282828] border-none rounded-md p-2 text-sm text-white focus:ring-1 focus:ring-white transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Artista</label>
                  <input
                    type="text"
                    value={formData.artist}
                    onChange={(e) => setFormData({...formData, artist: e.target.value})}
                    placeholder="Nombre del artista"
                    className="w-full bg-[#282828] border-none rounded-md p-2 text-sm text-white focus:ring-1 focus:ring-white transition-all outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-gray-400">Álbum</label>
                  <input
                    type="text"
                    value={formData.album}
                    onChange={(e) => setFormData({...formData, album: e.target.value})}
                    placeholder="Nombre del álbum"
                    className="w-full bg-[#282828] border-none rounded-md p-2 text-sm text-white focus:ring-1 focus:ring-white transition-all outline-none"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-2">
                  <ImageIcon className="w-3 h-3" />
                  <span>Imagen de Portada (Opcional)</span>
                </label>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20 cursor-pointer"
                />
              </div>

              {status.error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md flex items-center space-x-2 text-red-500 text-xs text-center justify-center">
                  <AlertCircle className="w-4 h-4" />
                  <span>{status.error}</span>
                </div>
              )}

              {status.success && (
                <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-md flex items-center space-x-2 text-green-500 text-xs text-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{status.message}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={isUploading}
                className="w-full bg-white text-black hover:bg-gray-200 font-bold h-10 transition-all active:scale-95"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  'Añadir a la biblioteca'
                )}
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
