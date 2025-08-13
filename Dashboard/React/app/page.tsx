"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Eye, CheckCircle, XCircle, Clock, RefreshCw, Activity } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Detection {
  id: string
  timestamp: string
  classe: string
  categoria: 'Blister' | 'Frasco' | 'Caixa'
  correto: boolean
  tempoInferencia: number
}

interface ChartData {
  time: string
  tempo: number
}

export default function Dashboard() {
  const [detections, setDetections] = useState<Detection[]>([])
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [isAutoRefresh, setIsAutoRefresh] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

// Converte timestamp para número (serve para "2025-08-12T19:35:08Z" ou "19:35:08")
const tsToMs = (ts: string) => {
  const d = new Date(ts);
  if (!isNaN(d.getTime())) return d.getTime(); // ISO, "YYYY-MM-DD HH:mm:ss", etc.

  const [h = "0", m = "0", s = "0"] = ts.split(":");
  return (Number(h) * 3600 + Number(m) * 60 + Number(s)) * 1000;
};

const sortDescByTs = (a: Detection, b: Detection) => tsToMs(b.timestamp) - tsToMs(a.timestamp);
const sortAscByTs  = (a: Detection, b: Detection) => tsToMs(a.timestamp) - tsToMs(b.timestamp);

  // Buscar dados reais da API Flask
const fetchDetections = async () => {
  try {
    const res = await fetch("http://192.168.15.109:5000/api/detections");
    const data: Detection[] = await res.json();

    const sortedData = [...data].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    setDetections(sortedData);

    const chartDataSorted = [...data].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    setChartData(
      chartDataSorted
        .slice(-20)
        .map((d) => ({ 
            time: d.timestamp.split(" ")[1],
            tempo: d.tempoInferencia 
        }))
    );
  } catch (err) {
    console.error("Erro ao buscar dados:", err);
  }
};


  // Enviar simulação de detecção via POST
  const addDetection = async () => {
    const detectionPayload = {
      tempo_ms: Math.floor(Math.random() * 200) + 50,
      objetos: [
        {
          classe: "Produto D",
          categoria: "Caixa",
          correto: Math.random() > 0.5
        }
      ]
    }

    try {
      await fetch("http://192.168.15.109:5000/detections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(detectionPayload)
      })
    } catch (err) {
      console.error("Erro ao enviar simulação:", err)
    }
  }

  // Auto refresh habilitado
  useEffect(() => {
    fetchDetections()
    if (isAutoRefresh) {
      const interval = setInterval(fetchDetections, 2000)
      return () => clearInterval(interval)
    }
  }, [isAutoRefresh])

  // Estatísticas
  const totalAnalysados = detections.length
  const produtosCorretos = detections.filter(d => d.correto).length
  const produtosIncorretos = detections.filter(d => !d.correto).length
  const tempoMedio = detections.length > 0
    ? Math.round(detections.reduce((acc, d) => acc + d.tempoInferencia, 0) / detections.length)
    : 0

  const contagemPorCategoria = {
    Blister: detections.filter(d => d.categoria === 'Blister').length,
    Frasco: detections.filter(d => d.categoria === 'Frasco').length,
    Caixa: detections.filter(d => d.categoria === 'Caixa').length
  }

return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 rounded-lg">
              <Eye className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
                Dashboard de Visão Computacional
              </h1>
              <p className="text-gray-400">Monitoramento em tempo real - Raspberry Pi</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              variant={isAutoRefresh ? "default" : "outline"}
              className={isAutoRefresh 
                ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700" 
                : "border-gray-600 text-gray-300 hover:bg-gray-800"
              }
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isAutoRefresh ? 'animate-spin' : ''}`} />
              {isAutoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
            </Button>
            <Button onClick={addDetection} variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              <Activity className="h-4 w-4 mr-2" />
              Simular Detecção
            </Button>
          </div>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Total Analisados</CardTitle>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger asChild>
                  <button className="p-1 rounded-full hover:bg-gray-700/50 transition-colors">
                    <Eye className="h-4 w-4 text-fuchsia-400 hover:text-fuchsia-300 cursor-pointer" />
                  </button>
                </DialogTrigger>
                <DialogContent className="bg-white text-gray-900 max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-900 flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-fuchsia-600" />
                      Análise por Categoria
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="font-medium text-gray-700">Blister</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{contagemPorCategoria.Blister}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="font-medium text-gray-700">Frasco</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{contagemPorCategoria.Frasco}</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                          <span className="font-medium text-gray-700">Caixa</span>
                        </div>
                        <span className="text-2xl font-bold text-gray-900">{contagemPorCategoria.Caixa}</span>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-600">Total Geral:</span>
                        <span className="text-xl font-bold text-fuchsia-600">{totalAnalysados}</span>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalAnalysados}</div>
              <p className="text-xs text-gray-400">objetos processados</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Produtos Corretos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{produtosCorretos}</div>
              <p className="text-xs text-gray-400">
                {totalAnalysados > 0 ? `${Math.round((produtosCorretos / totalAnalysados) * 100)}%` : '0%'} de acerto
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Produtos Incorretos</CardTitle>
              <XCircle className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-400">{produtosIncorretos}</div>
              <p className="text-xs text-gray-400">
                {totalAnalysados > 0 ? `${Math.round((produtosIncorretos / totalAnalysados) * 100)}%` : '0%'} de erro
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-300">Tempo Médio</CardTitle>
              <Clock className="h-4 w-4 text-fuchsia-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{tempoMedio}ms</div>
              <p className="text-xs text-gray-400">tempo de inferência</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Activity className="h-5 w-5 mr-2 text-fuchsia-400" />
              Tempo de Inferência ao Longo do Tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="time" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    label={{ value: 'Tempo (ms)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1F2937', 
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#F9FAFB'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="tempo" 
                    stroke="url(#gradient)" 
                    strokeWidth={3}
                    dot={{ fill: '#EC4899', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#EC4899' }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#C026D3" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Resultados */}
        <Card className="bg-gray-800/50 border-gray-700 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Eye className="h-5 w-5 mr-2 text-fuchsia-400" />
              Resultados em Tempo Real
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Time Stamp</TableHead>
                    <TableHead className="text-gray-300">Classe Detectada</TableHead>
                    <TableHead className="text-gray-300">Categoria</TableHead>
                    <TableHead className="text-gray-300">Status</TableHead>
                    <TableHead className="text-gray-300">Tempo de Inferência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detections.slice(0, 10).map((detection) => (
                    <TableRow key={detection.id} className="border-gray-700 hover:bg-gray-700/30">
                      <TableCell className="text-gray-300 font-mono text-sm">
                        {detection.timestamp}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {detection.classe}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline"
                          className={`border-gray-600 text-xs ${
                            detection.categoria === 'Blister' ? 'text-blue-400 border-blue-400' :
                            detection.categoria === 'Frasco' ? 'text-green-400 border-green-400' :
                            'text-orange-400 border-orange-400'
                          }`}
                        >
                          {detection.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={detection.correto ? "default" : "destructive"}
                          className={detection.correto 
                            ? "bg-green-600 hover:bg-green-700 text-white" 
                            : "bg-red-600 hover:bg-red-700 text-white"
                          }
                        >
                          {detection.correto ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Correto
                            </>
                          ) : (
                            <>
                              <XCircle className="h-3 w-3 mr-1" />
                              Incorreto
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-300 font-mono">
                        {detection.tempoInferencia}ms
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {detections.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  Aguardando dados de detecção...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
