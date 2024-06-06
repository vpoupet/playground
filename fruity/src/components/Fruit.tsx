type FruitProps = {
    name: string;
    hidden?: boolean;
};

export function Fruit({ name, hidden = false }: FruitProps) {
    return (
        <div
            className={`fruit w-16 h-16 bg-contain rounded-full ${hidden ? '' : 'shadow-sm'} shadow-slate-600 m-1 ${
                hidden ? "opacity-30" : ""
            }`}
            style={{ backgroundImage: `url(images/fruits/${name}.jpeg)` }}
        ></div>
    );
}
