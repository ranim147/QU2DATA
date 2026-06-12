import polars as pl

datasets: dict[str, pl.DataFrame] = {}


def save_dataset(dataset_id: str, df: pl.DataFrame) -> None:
    datasets[dataset_id] = df


def get_dataset(dataset_id: str) -> pl.DataFrame | None:
    return datasets.get(dataset_id)


def delete_dataset(dataset_id: str) -> None:
    datasets.pop(dataset_id, None)


def update_dataset(dataset_id: str, df: pl.DataFrame) -> None:
    datasets[dataset_id] = df