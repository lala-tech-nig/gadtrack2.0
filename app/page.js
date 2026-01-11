'use client';
import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

export default function Home() {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/devices/lookup/${query}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.msg || 'Device not found');
      setResult(data);
      toast.success('Device found!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 to-white pt-20 pb-32">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight mb-6">
              Secure Your <span className="text-orange-600">Digital Life</span>
            </h1>
            <p className="text-xl text-gray-600 mb-10">
              The #1 platform to eradicate gadget theft in Africa. key in your device history to verify ownership before you buy.
            </p>

            <form onSubmit={handleLookup} className="relative max-w-xl mx-auto shadow-2xl rounded-full">
              <input
                type="text"
                className="w-full px-8 py-5 text-lg rounded-full border-2 border-transparent focus:border-orange-500 outline-none transition-all placeholder-gray-400"
                placeholder="Enter IMEI or Serial Number..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="absolute right-2 top-2 bottom-2 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-8 rounded-full transition-colors disabled:opacity-70"
              >
                {loading ? 'Scanning...' : 'Trace It'}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Decorative Circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-orange-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      </section>

      {/* Result Section */}
      <AnimatePresence>
        {result && (
          <motion.section
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="container mx-auto px-4 -mt-20 relative z-20 pb-20"
          >
            <div className={`mx-auto max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border-t-8 ${result.status === 'stolen' ? 'border-red-500' : 'border-green-500'}`}>

              {/* Header */}
              <div className="p-8 md:p-12 border-b border-gray-100 bg-gray-50">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">{result.brand} {result.model}</h2>
                    <p className="text-gray-500 mt-1">SN: {result.serialNumber} • IMEI: {result.imei || 'N/A'}</p>
                  </div>
                  <span className={`px-6 py-2 rounded-full text-lg font-bold uppercase tracking-wider ${result.status === 'stolen' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                    {result.status}
                  </span>
                </div>
              </div>

              {/* Grid Details */}
              <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">Device Details</h3>
                    <div className="bg-gray-50 p-6 rounded-xl space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Color</span>
                        <span className="font-medium">{result.color || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Owner</span>
                        <span className="font-medium text-gray-900">{result.owner?.name ? `${result.owner.name.substring(0, 3)}***` : 'Unknown'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Registered</span>
                        <span className="font-medium">{new Date(result.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {result.status !== 'stolen' ? (
                    <div className="bg-orange-50 border border-orange-100 p-6 rounded-xl">
                      <p className="text-orange-800 mb-4 font-medium">✨ Interested in this device?</p>
                      <Link href="/auth" className="block w-full text-center bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-lg transition-colors">
                        Login to Request Transfer
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={() => toast.success('Police notified! Stay safe.')}
                      className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-xl shadow-lg animate-pulse"
                    >
                      ⚠ REPORT DEVICE FOUND
                    </button>
                  )}
                </div>

                {/* Timeline History */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Ownership History</h3>
                  <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 before:to-transparent">
                    {result.history && result.history.map((record, idx) => (
                      <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-gray-100 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          <div className={`w-3 h-3 rounded-full ${record.action.includes('stolen') ? 'bg-red-500' : 'bg-green-500'}`}></div>
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          <div className="flex items-center justify-between space-x-2 mb-1">
                            <div className="font-bold text-gray-900">{record.action.replace(/_/g, ' ')}</div>
                            <time className="font-caveat font-medium text-orange-500 text-sm">
                              {new Date(record.date).toLocaleDateString()}
                            </time>
                          </div>
                          <div className="text-gray-500 text-sm">
                            Owner: <span className="font-medium text-gray-900">{record.owner?.name || 'System'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            { title: 'Register Gadgets', desc: 'Secure digital vault for all your devices.', icon: '🛡️' },
            { title: 'Transfer Ownership', desc: 'Legally transfer devices to new owners.', icon: '🤝' },
            { title: 'Verify History', desc: 'Check device lifecycle before buying.', icon: '🔍' }
          ].map((feature, i) => (
            <div key={i} className="group p-8 rounded-2xl bg-white border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
