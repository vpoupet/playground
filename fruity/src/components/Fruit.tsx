type FruitProps = {
    name: string;
};

export function Fruit({ name }: FruitProps) {
    return (
        <div
            className="fruit w-16 h-16 bg-contain rounded-full shadow-lg m-1"
            style={{ backgroundImage: `url(images/fruits/${name}.jpeg)` }}
        ></div>
    );
}
