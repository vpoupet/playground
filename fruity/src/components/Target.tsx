import { Fruit } from "./Fruit";

type TargetProps = {
  fruits: string[];
  bgColor: string;
};

export function Target({ fruits, bgColor }: TargetProps) {
  return (
    <div className={`target p-1 w-fit h-fit rounded-full bg-gradient-to-b from-${bgColor}-200 to-${bgColor}-400 shadow-slate-600 shadow-sm`}>
      {fruits.map((fruit, index) => (
        <Fruit name={fruit} key={index}/>
      ))}
    </div>
  );
}
