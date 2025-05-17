import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const AUTO_LOTTERY_ADDRESS = "0x..."; 

export function AutoLottery() {
  return (
    <Card className="w-full">
      <CardContent>
        <div className="text-center mb-8">
          <p className="text-2xl font-bold mb-2">Auto Lottery</p>
          <p className="text-xl">
            Current Prize: <span className="font-bold">X ETH</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Chance to win: 0.001% per deposit
          </p>
        </div>

        <div className="text-center mb-8">
          <p className="text-xl mb-2">Last Winner</p>
          <p className="text-lg font-mono">0x123...abc</p>
          <p className="text-sm text-muted-foreground mt-2">
            Won: 2.5 ETH (Round #15)
          </p>
        </div>

        <div className="flex justify-center">
          <div className="space-y-4 w-full max-w-md">
            <div className="space-y-2">
              <Label htmlFor="autoDepositAmount">
                Deposit ETH to participate (1 ETH)
              </Label>
              <Input
                id="autoDepositAmount"
                type="number"
                placeholder="1.0"
                disabled
                value="1"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <Button>Deposit 1 ETH</Button>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-1 gap-4">
              <p className="text-xs text-muted-foreground text-center">
                Winner is selected automatically with 0.001% chance per deposit
              </p>
            </div>
          </div>
        </div>

        <Separator className="my-4" />
        <div className="space-y-2 mt-4">
          <p className="font-medium">Lottery Statistics:</p>
          <p className="text-sm">
            <span className="text-muted-foreground">Contract Address: </span>
            {AUTO_LOTTERY_ADDRESS.slice(0, 5)}...
            {AUTO_LOTTERY_ADDRESS.slice(-3)}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">
              Current Participants:{" "}
            </span>
            42
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Total Rounds: </span>
            15
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Total Participants: </span>
            1,234
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Auto Lottery Contract - Instant win chance with each deposit
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
