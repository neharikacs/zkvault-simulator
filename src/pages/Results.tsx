/**
 * Results & Charts Page
 * 
 * Displays research paper results:
 * - Accuracy graph (Figure 3)
 * - Confusion matrix heatmap (Figure 4)
 * - System performance metrics
 */

import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { getBlockchainStats } from '@/lib/simulation/blockchain';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Clock,
  Shield,
  CheckCircle,
  BarChart3,
} from 'lucide-react';

// Simulated accuracy data (similar to Figure 3 from paper)
const accuracyData = [
  { epoch: 1, accuracy: 0.65, validation: 0.62 },
  { epoch: 2, accuracy: 0.72, validation: 0.70 },
  { epoch: 3, accuracy: 0.78, validation: 0.76 },
  { epoch: 4, accuracy: 0.82, validation: 0.80 },
  { epoch: 5, accuracy: 0.85, validation: 0.84 },
  { epoch: 6, accuracy: 0.88, validation: 0.87 },
  { epoch: 7, accuracy: 0.90, validation: 0.89 },
  { epoch: 8, accuracy: 0.92, validation: 0.91 },
  { epoch: 9, accuracy: 0.93, validation: 0.92 },
  { epoch: 10, accuracy: 0.94, validation: 0.93 },
  { epoch: 11, accuracy: 0.95, validation: 0.94 },
  { epoch: 12, accuracy: 0.955, validation: 0.945 },
  { epoch: 13, accuracy: 0.96, validation: 0.95 },
  { epoch: 14, accuracy: 0.962, validation: 0.952 },
  { epoch: 15, accuracy: 0.965, validation: 0.955 },
];

// Confusion matrix data (similar to Figure 4 from paper)
const confusionMatrix = [
  { actual: 'Valid', predicted: 'Valid', value: 95, label: 'True Positive' },
  { actual: 'Valid', predicted: 'Invalid', value: 3, label: 'False Negative' },
  { actual: 'Invalid', predicted: 'Valid', value: 2, label: 'False Positive' },
  { actual: 'Invalid', predicted: 'Invalid', value: 97, label: 'True Negative' },
];

// Performance metrics
const performanceData = [
  { name: 'Hash Gen', time: 12, unit: 'ms' },
  { name: 'IPFS Store', time: 450, unit: 'ms' },
  { name: 'ZK Proof Gen', time: 850, unit: 'ms' },
  { name: 'Blockchain Tx', time: 320, unit: 'ms' },
  { name: 'Verification', time: 180, unit: 'ms' },
];

// Verification distribution
const verificationDistribution = [
  { name: 'Valid', value: 85, color: 'hsl(142, 76%, 45%)' },
  { name: 'Invalid', value: 8, color: 'hsl(0, 72%, 51%)' },
  { name: 'Revoked', value: 5, color: 'hsl(45, 93%, 47%)' },
  { name: 'Not Found', value: 2, color: 'hsl(217, 33%, 40%)' },
];

export default function Results() {
  const stats = getBlockchainStats();
  
  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Results & Analysis</h1>
          <p className="text-muted-foreground mt-1">
            System performance metrics and research paper visualizations
          </p>
        </div>
        
        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-success/10">
                <Target className="w-5 h-5 text-success" />
              </div>
              <span className="text-sm text-muted-foreground">Accuracy</span>
            </div>
            <p className="text-3xl font-bold text-foreground">96.5%</p>
          </div>
          
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-muted-foreground">Precision</span>
            </div>
            <p className="text-3xl font-bold text-foreground">97.9%</p>
          </div>
          
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-accent/20">
                <CheckCircle className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-sm text-muted-foreground">Recall</span>
            </div>
            <p className="text-3xl font-bold text-foreground">96.9%</p>
          </div>
          
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-warning/10">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <span className="text-sm text-muted-foreground">Avg Time</span>
            </div>
            <p className="text-3xl font-bold text-foreground">1.8s</p>
          </div>
        </div>
        
        {/* Accuracy Chart */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Model Accuracy Over Training</h2>
              <p className="text-sm text-muted-foreground">Based on Figure 3 from research paper</p>
            </div>
          </div>
          
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="epoch" 
                  stroke="hsl(var(--muted-foreground))"
                  label={{ value: 'Epoch', position: 'insideBottom', offset: -5, fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  domain={[0.6, 1]}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  label={{ value: 'Accuracy', angle: -90, position: 'insideLeft', fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${(value * 100).toFixed(1)}%`, '']}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  name="Training Accuracy"
                  stroke="hsl(185, 80%, 50%)"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(185, 80%, 50%)', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 6, fill: 'hsl(185, 80%, 50%)' }}
                />
                <Line
                  type="monotone"
                  dataKey="validation"
                  name="Validation Accuracy"
                  stroke="hsl(142, 76%, 45%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(142, 76%, 45%)', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 6, fill: 'hsl(142, 76%, 45%)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Confusion Matrix */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-6">
              <BarChart3 className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Confusion Matrix</h2>
                <p className="text-sm text-muted-foreground">Based on Figure 4 from research paper</p>
              </div>
            </div>
            
            {/* Matrix Grid */}
            <div className="aspect-square max-w-sm mx-auto">
              <div className="grid grid-cols-3 gap-1 text-center">
                {/* Header */}
                <div></div>
                <div className="p-2 text-xs font-medium text-muted-foreground">Predicted Valid</div>
                <div className="p-2 text-xs font-medium text-muted-foreground">Predicted Invalid</div>
                
                {/* Row 1 */}
                <div className="p-2 text-xs font-medium text-muted-foreground flex items-center justify-end">Actual Valid</div>
                <div className="p-4 rounded-lg bg-success/20 text-success font-bold text-xl">
                  95
                  <p className="text-xs font-normal mt-1">TP</p>
                </div>
                <div className="p-4 rounded-lg bg-warning/20 text-warning font-bold text-xl">
                  3
                  <p className="text-xs font-normal mt-1">FN</p>
                </div>
                
                {/* Row 2 */}
                <div className="p-2 text-xs font-medium text-muted-foreground flex items-center justify-end">Actual Invalid</div>
                <div className="p-4 rounded-lg bg-destructive/20 text-destructive font-bold text-xl">
                  2
                  <p className="text-xs font-normal mt-1">FP</p>
                </div>
                <div className="p-4 rounded-lg bg-success/20 text-success font-bold text-xl">
                  97
                  <p className="text-xs font-normal mt-1">TN</p>
                </div>
              </div>
            </div>
            
            {/* Legend */}
            <div className="flex justify-center gap-6 mt-6 text-xs text-muted-foreground">
              <span>TP: True Positive</span>
              <span>TN: True Negative</span>
              <span>FP: False Positive</span>
              <span>FN: False Negative</span>
            </div>
          </div>
          
          {/* Verification Distribution */}
          <div className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-5 h-5 text-primary" />
              <div>
                <h2 className="text-lg font-semibold text-foreground">Verification Results</h2>
                <p className="text-sm text-muted-foreground">Distribution of verification outcomes</p>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={verificationDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {verificationDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [`${value}%`, '']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
        
        {/* Performance Metrics */}
        <div className="p-6 rounded-xl bg-card border border-border">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-lg font-semibold text-foreground">Operation Performance</h2>
              <p className="text-sm text-muted-foreground">Average execution time for each operation</p>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="hsl(var(--muted-foreground))"
                  tickFormatter={(v) => `${v}ms`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  width={100}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => [`${value}ms`, 'Time']}
                />
                <Bar dataKey="time" fill="hsl(185, 80%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Research Info */}
        <div className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-card to-card border border-primary/20">
          <h3 className="font-semibold text-foreground mb-4">
            Research Paper Reference
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            "ZK-Vault: A Verification and Issuance System for Tamper-Proof Certificates using Zero-Knowledge Proofs"
          </p>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-4 rounded-lg bg-card">
              <p className="font-medium text-foreground mb-1">Key Features</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• SHA-256 hashing</li>
                <li>• zk-SNARK proofs</li>
                <li>• IPFS storage</li>
                <li>• Blockchain ledger</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-card">
              <p className="font-medium text-foreground mb-1">Security</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• Selective disclosure</li>
                <li>• Tamper detection</li>
                <li>• Immutable records</li>
                <li>• RBAC access control</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-card">
              <p className="font-medium text-foreground mb-1">Performance</p>
              <ul className="text-muted-foreground space-y-1">
                <li>• 96.5% accuracy</li>
                <li>• 1.8s avg verification</li>
                <li>• 97.9% precision</li>
                <li>• Scalable architecture</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
