import React, { useState } from 'react';
import { data } from 'react-router-dom';

function MasterDataImport(){
    const [file, setFile] = useState(null);
    const [entityType, setEntityType] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

const handleUpload = async () => {
  setErrorMessage('');
  setSuccessMessage('');

  if (!entityType) {
    setErrorMessage('Please select an entity type.');
    return;
  }

  if (!file) {
    setErrorMessage('Please select a file to upload.');
    return;
  }

  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("entityType", entityType);
    for (let [key, value] of formData.entries()) {
        console.log(`${key}:`, value);
    }
    const response = await fetch("http://localhost:3000/import", {
      method: "POST",
      body: formData,
    });

    const result = await response.json();

    if (response.ok) {
      setSuccessMessage("File uploaded successfully.");
      setFile(null)
      setEntityType('')
      console.log(result)
    } else {
      setErrorMessage(result.message || "Upload failed.");
    }
  } catch (error) {
    console.log(error);
    setErrorMessage("Something went wrong while uploading.");
  }
};

    return (
        <div className="p-4 ml-[20%]">
            {successMessage && (
                <div className="p-3 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded w-72 text-center mb-4 mx-auto block">
                    {successMessage}
                </div>
            )}
        <h2 className="text-xl font-semibold mb-4">Import Master Data</h2>

        <select
            className="border p-2 mb-4 block"
            onChange={(e) => setEntityType(e.target.value)}
        >
            <option value="">Select Entity</option>
            <option value="Country">Country</option>
            <option value="State">State</option>
            <option value="City">City</option>
            <option value="Test">Test</option>
            <option value="Service">Service</option>
        </select>

        <input
            type="file"
            className="block mb-4"
            accept=".csv, .xlsx"
            onChange={(e) => setFile(e.target.files[0])}
        />

        <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleUpload}
        >
            Upload
        </button>

        {errorMessage && <pre  className="mt-4 text-red-500">{errorMessage}</pre >}
        </div>
    );
}

export default MasterDataImport;
