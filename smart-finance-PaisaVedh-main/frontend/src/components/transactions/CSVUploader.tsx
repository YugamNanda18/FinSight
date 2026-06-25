import React, { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X } from 'lucide-react'
import { useTransactionStore } from '../../store/transaction.store'

const CSVUploader = ({ onSuccess }: { onSuccess?: () => void }) => {
  const [file, setFile] = React.useState<File | null>(null)
  const { uploadCSV, isLoading } = useTransactionStore()

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) setFile(acceptedFiles[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
  })

  const handleUpload = async () => {
    if (file) {
      await uploadCSV(file)
      setFile(null)
      onSuccess?.()
    }
  }

  return (
    <div className="space-y-4">
      <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}`}>
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        {isDragActive ? <p className="text-primary-500">Drop the CSV file here...</p> : <p className="text-gray-500">Drag & drop a CSV file here, or click to select</p>}
        <p className="text-xs text-gray-400 mt-2">Supported format: .csv (Max 5MB)</p>
      </div>

      {file && (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center gap-2"><FileText className="w-4 h-4 text-primary-500" /><span className="text-sm">{file.name}</span><span className="text-xs text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span></div>
          <button onClick={() => setFile(null)} className="p-1 hover:bg-gray-200 rounded"><X className="w-4 h-4" /></button>
        </div>
      )}

      <button onClick={handleUpload} disabled={!file || isLoading} className="w-full py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-medium disabled:opacity-50">
        {isLoading ? 'Uploading...' : 'Upload & Process'}
      </button>
    </div>
  )
}

export default CSVUploader