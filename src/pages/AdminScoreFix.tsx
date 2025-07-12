import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, RefreshCw, CheckCircle, Users } from "lucide-react";
import {
  recalculateAllScores,
  getHighScorers,
} from "@/utils/recalculateScores";

const AdminScoreFix = () => {
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [recalcResult, setRecalcResult] = useState<any>(null);
  const [highScorers, setHighScorers] = useState<any[]>([]);
  const { toast } = useToast();

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const result = await recalculateAllScores();
      setRecalcResult(result);

      if (result.success) {
        toast({
          title: "Recalculation Completed",
          description: `Updated ${result.updated} out of ${result.total} records`,
        });

        // Refresh halaman ranking jika ada
        window.dispatchEvent(new CustomEvent("ranking-refresh"));
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to recalculate scores",
        variant: "destructive",
      });
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleCheckHighScorers = async () => {
    setIsChecking(true);
    try {
      const result = await getHighScorers();

      if (result.success) {
        setHighScorers(result.data);
        toast({
          title: "Check Complete",
          description: `Found ${result.data.length} employees with 90%+ scores`,
        });
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check high scorers",
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Score Fix Tool</h1>
          <p className="text-muted-foreground">
            Tools untuk memperbaiki dan memverifikasi scoring system
          </p>
        </div>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <RefreshCw className="h-5 w-5 mr-2" />
              Recalculate All Scores
            </CardTitle>
            <CardDescription>
              Menghitung ulang semua skor menggunakan logic terbaru
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleRecalculate}
              disabled={isRecalculating}
              className="w-full"
            >
              {isRecalculating ? "Recalculating..." : "Start Recalculation"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Check High Scorers
            </CardTitle>
            <CardDescription>
              Cek pegawai dengan skor 90%+ dan validasi kriteria
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleCheckHighScorers}
              disabled={isChecking}
              variant="outline"
              className="w-full"
            >
              {isChecking ? "Checking..." : "Check High Scorers"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recalculation Results */}
      {recalcResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              {recalcResult.success ? (
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
              ) : (
                <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              )}
              Recalculation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recalcResult.success ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">
                      {recalcResult.total}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Total Records
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {recalcResult.updated}
                    </div>
                    <div className="text-sm text-muted-foreground">Updated</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {recalcResult.total - recalcResult.updated}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Unchanged
                    </div>
                  </div>
                </div>

                {recalcResult.results && recalcResult.results.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold">Score Changes:</h4>
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {recalcResult.results.map(
                        (result: any, index: number) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm"
                          >
                            <span>{result.id.substring(0, 8)}...</span>
                            <span>
                              {result.oldScore?.toFixed(1)}% →{" "}
                              {result.newScore?.toFixed(1)}%
                            </span>
                          </div>
                        ),
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600">Error: {recalcResult.error}</div>
            )}
          </CardContent>
        </Card>
      )}

      {/* High Scorers */}
      {highScorers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>High Scorers (90%+)</CardTitle>
            <CardDescription>
              Pegawai dengan skor tinggi dan validasi kriteria mereka
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {highScorers.map((scorer: any) => (
                <div key={scorer.id} className="border rounded p-4 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold">{scorer.pegawai?.nama}</h4>
                      <p className="text-sm text-muted-foreground">
                        NIP: {scorer.pegawai?.nip}
                      </p>
                    </div>
                    <Badge variant="default">
                      {scorer.persentase_akhir?.toFixed(1)}%
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                    <div className="flex items-center space-x-1">
                      <span
                        className={
                          scorer.bebas_temuan
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {scorer.bebas_temuan ? "✓" : "✗"}
                      </span>
                      <span>Bebas Temuan</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span
                        className={
                          scorer.tidak_hukuman_disiplin
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {scorer.tidak_hukuman_disiplin ? "✓" : "✗"}
                      </span>
                      <span>No Hukuman</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span
                        className={
                          scorer.tidak_pemeriksaan_disiplin
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {scorer.tidak_pemeriksaan_disiplin ? "✓" : "✗"}
                      </span>
                      <span>No Pemeriksaan</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span
                        className={
                          scorer.memiliki_inovasi
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {scorer.memiliki_inovasi ? "✓" : "✗"}
                      </span>
                      <span>Inovasi</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <span
                        className={
                          scorer.memiliki_penghargaan
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        {scorer.memiliki_penghargaan ? "✓" : "✗"}
                      </span>
                      <span>Penghargaan</span>
                    </div>
                  </div>

                  {/* Validation Alert */}
                  {scorer.persentase_akhir >= 90 &&
                    (!scorer.pegawai?.memiliki_inovasi ||
                      !scorer.pegawai?.memiliki_penghargaan) && (
                      <div className="bg-red-50 border border-red-200 rounded p-2 text-red-800 text-sm">
                        ⚠️ INVALID: Score 90%+ requires both innovation AND
                        achievement
                      </div>
                    )}

                  {(!scorer.pegawai?.bebas_temuan ||
                    !scorer.pegawai?.tidak_hukuman_disiplin ||
                    !scorer.pegawai?.tidak_pemeriksaan_disiplin) && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 text-red-800 text-sm">
                      ⚠️ INVALID: Incomplete integrity should limit score to 70%
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminScoreFix;
