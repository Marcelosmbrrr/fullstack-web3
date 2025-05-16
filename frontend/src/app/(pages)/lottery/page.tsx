import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const CONTRACT_ADDRESS = "0xD6D47F2f14869560B5c9BA15878ec622c6Cc1e31";

export default function Lottery() {
  return (
    <div className="container max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">Lottery</h1>

      <Card className="w-full">
        <CardContent>
          {/* Current Round Info */}
          <div className="text-center mb-8">
            <p className="text-3xl font-bold mb-2">Round #1</p>
            <p className="text-xl">
              Total Prize: <span className="font-bold">X ETH</span>
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Time remaining for distribution: 12:34:56
            </p>
          </div>

          {/* User Participation */}
          <div className="text-center mb-8">
            <p className="text-xl mb-2">Your participation</p>
            <p className="text-2xl font-bold">Y ETH</p>
            <p className="text-sm text-muted-foreground mt-2">
              Your current deposit in this round
            </p>
          </div>

          {/* Lottery Controls */}
          <div className="flex justify-center">
            <div className="space-y-4 w-full max-w-md">
              <div className="space-y-2">
                <Label htmlFor="depositAmount">
                  Deposit ETH to participate
                </Label>
                <Input id="depositAmount" type="number" placeholder="0.1" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button>Deposit</Button>
                <Button variant="destructive">Cancel Deposit</Button>
              </div>

              <Separator className="my-4" />

              <div className="grid grid-cols-2 gap-4">
                <Button variant="success">Distribute Prize</Button>
                <Button variant="default">Start New Round</Button>
              </div>
            </div>
          </div>

          {/* Contract Info */}
          <Separator className="my-4" />
          <div className="space-y-2 mt-4">
            <p className="font-medium">Lottery Information:</p>

            <p className="text-sm">
              <span className="text-muted-foreground">Contract Address: </span>
              0x123...abc
            </p>

            <p className="text-sm">
              <span className="text-muted-foreground">
                Total Participants:{" "}
              </span>
              24
            </p>

            <p className="text-sm">
              <span className="text-muted-foreground">Round Duration: </span>
              24 hours
            </p>

            <p className="text-xs text-muted-foreground mt-2">
              Lottery Contract - Manages prize distribution and round management
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
