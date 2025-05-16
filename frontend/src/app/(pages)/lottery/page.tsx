import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

const SUPER_LOTTERY_ADDRESS = "0xD6D47F2f14869560B5c9BA15878ec622c6Cc1e31";
const SIMPLE_LOTTERY_ADDRESS = "0x..."; // Adicione o endereço do SimpleLottery
const AUTO_LOTTERY_ADDRESS = "0x..."; // Adicione o endereço do AutoLottery

export default function Lottery() {
  return (
    <div className="container max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Lottery Contracts</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Super Lottery Card */}
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

            <Separator className="my-4" />
            <div className="space-y-2 mt-4">
              <p className="font-medium">Lottery Information:</p>
              <p className="text-sm">
                <span className="text-muted-foreground">
                  Contract Address:{" "}
                </span>
                {SUPER_LOTTERY_ADDRESS.slice(0, 5)}...
                {SUPER_LOTTERY_ADDRESS.slice(-3)}
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
                Super Lottery Contract - Manages prize distribution with
                multiple rounds
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Simple Lottery Card */}
        <Card className="w-full">
          <CardContent>
            <div className="text-center mb-8">
              <p className="text-2xl font-bold mb-2">Simple Lottery</p>
              <p className="text-xl">
                Current Prize: <span className="font-bold">X ETH</span>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Minimum 3 participants required
              </p>
            </div>

            <div className="text-center mb-8">
              <p className="text-xl mb-2">Your participation</p>
              <p className="text-2xl font-bold">Y ETH</p>
              <p className="text-sm text-muted-foreground mt-2">
                Your current deposit
              </p>
            </div>

            <div className="flex justify-center">
              <div className="space-y-4 w-full max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="simpleDepositAmount">
                    Deposit ETH to participate (1 ETH)
                  </Label>
                  <Input
                    id="simpleDepositAmount"
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
                  <Button variant="success" disabled>
                    Select Winner
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Only contract owner can select winner
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-4" />
            <div className="space-y-2 mt-4">
              <p className="font-medium">Lottery Information:</p>
              <p className="text-sm">
                <span className="text-muted-foreground">
                  Contract Address:{" "}
                </span>
                {SIMPLE_LOTTERY_ADDRESS.slice(0, 5)}...
                {SIMPLE_LOTTERY_ADDRESS.slice(-3)}
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">
                  Current Participants:{" "}
                </span>
                2
              </p>
              <p className="text-sm">
                <span className="text-muted-foreground">Entry Fee: </span>1 ETH
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Simple Lottery Contract - Winner takes all after minimum 3
                participants
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Auto Lottery Card */}
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
                    Winner is selected automatically with 0.001% chance per
                    deposit
                  </p>
                </div>
              </div>
            </div>

            <Separator className="my-4" />
            <div className="space-y-2 mt-4">
              <p className="font-medium">Lottery Statistics:</p>
              <p className="text-sm">
                <span className="text-muted-foreground">
                  Contract Address:{" "}
                </span>
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
                <span className="text-muted-foreground">
                  Total Participants:{" "}
                </span>
                1,234
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Auto Lottery Contract - Instant win chance with each deposit
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
