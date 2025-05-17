import { AutoLottery } from "./_components/AutoLottery";
import { SimpleLottery } from "./_components/SimpleLottery";
import { SuperLottery } from "./_components/SuperLottery";

export default function Lottery() {
  return (
    <div className="container max-w-6xl">
      <h1 className="text-3xl font-bold mb-6">Lottery Contracts</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SimpleLottery />
        <AutoLottery />
        <SuperLottery />
      </div>
    </div>
  );
}
