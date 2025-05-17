import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const SUPER_LOTTERY_ADDRESS = "0x...";

export function SuperLottery() {
  return (
    <Card className="w-full">
      <CardContent>
        <div className="text-center mb-8">
          <p className="text-2xl font-bold mb-2">Super Lottery</p>
          <p className="text-xl">
            Total Prize: <span className="font-bold">X ETH</span>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Time remaining for distribution: 12:34:56
          </p>
        </div>

        <div className="text-center mb-8">
          <p className="text-xl mb-2">Your participation</p>
          <p className="text-2xl font-bold">Y ETH</p>
          <p className="text-sm text-muted-foreground mt-2">
            Your current deposit in this round
          </p>
        </div>

        <div className="flex justify-center">
          <div className="space-y-4 w-full max-w-md">
            <div className="space-y-2">
              <Label htmlFor="depositAmount">Deposit ETH to participate</Label>
              <Input id="depositAmount" type="number" placeholder="0.1" />
            </div>

            <div>
              <Button className="w-full">Deposit</Button>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <Button variant="success">Select Winner</Button>
              <Button variant="alert">Start New Round</Button>
            </div>
          </div>
        </div>

        <Separator className="my-4" />
        <div className="space-y-2 mt-4">
          <p className="font-medium">Lottery Information:</p>
          <p className="text-sm">
            <span className="text-muted-foreground">Contract Address: </span>
            {SUPER_LOTTERY_ADDRESS.slice(0, 5)}...
            {SUPER_LOTTERY_ADDRESS.slice(-3)}
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Total Participants: </span>
            24
          </p>
          <p className="text-sm">
            <span className="text-muted-foreground">Round Duration: </span>
            24 hours
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Super Lottery Contract - Manages prize distribution with multiple
            rounds
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
