from fastapi import APIRouter
from utils.response import APIResponse
from utils.dataframe_utils import persist_transformation_result
from schemas.sampling_schema import (
    QuotaCellResponse,
    QuotaSamplingRequest,
    QuotaSamplingResponseData,
    SamplingResponseData,
    SimpleRandomSampleRequest,
    StratifiedSamplingRequest,
    SystematicSampleRequest,
    StratifiedSamplingResponseData,
    BootstrapSamplingResponseData,
    BootstrapSamplingRequest,
)
from services.sampling_service import (
    dataframe_to_records,
    quota_sample,
    simple_random_sample,
    systematic_sample,
    stratified_sample,
    bootstrap_sample,
)
from services.minio_file_store_service import load_working_dataframe, save_dataset

router = APIRouter(prefix="/sampling", tags=["Sampling"])

VALID_MODES = ("proportionnel", "equilibre")


@router.post("/simple-random", response_model=APIResponse)
def generate_simple_random_sample(request: SimpleRandomSampleRequest):
    df, source = load_working_dataframe(request.file_id)
    total_rows = len(df)
    sampled_df, selected_indices = simple_random_sample(
        df=df,
        size=request.size,
        size_mode=request.size_mode,
        seed=request.seed
    )

    persistence = persist_transformation_result(
        request.file_id,
        sampled_df,
    )

    records = dataframe_to_records(sampled_df)
    result = SamplingResponseData(
        file_id=request.file_id,
        source=source,
        **persistence,
        method="simple_random",
        total_rows=total_rows,
        sample_size=len(sampled_df),
        size_mode=request.size_mode,
        size_value=request.size,
        seed=request.seed,
        confidence=request.confidence,
        selected_indices=selected_indices,
        rows=len(sampled_df),
        columns=list(sampled_df.columns),
        preview=records[:5],
        data=records
    )
    return APIResponse.ok(
        data=result,
        message="Simple random sample generated successfully"
    )


@router.post("/systematic", response_model=APIResponse)
def generate_systematic_sample(request: SystematicSampleRequest):
    df, source = load_working_dataframe(request.file_id)
    total_rows = len(df)
    sampled_df, selected_indices, k, offset = systematic_sample(
        df=df,
        size=request.size,
        size_mode=request.size_mode,
        seed=request.seed
    )

    persistence = persist_transformation_result(
        request.file_id,
        sampled_df,
    )

    records = dataframe_to_records(sampled_df)
    result = SamplingResponseData(
        file_id=request.file_id,
        source=source,
        **persistence,
        method="systematic",
        total_rows=total_rows,
        sample_size=len(sampled_df),
        size_mode=request.size_mode,
        size_value=request.size,
        seed=request.seed,
        confidence=request.confidence,
        k=k,
        offset=offset,
        selected_indices=selected_indices,
        rows=len(sampled_df),
        columns=list(sampled_df.columns),
        preview=records[:5],
        data=records
    )
    return APIResponse.ok(
        data=result,
        message="Systematic sample generated successfully"
    )


@router.post("/quotas", response_model=APIResponse)
def generate_quota_sample(request: QuotaSamplingRequest):
    df, source = load_working_dataframe(request.file_id)
    total_rows = len(df)
    sampled_df, selected_indices, quota_results = quota_sample(
        df=df,
        quota_columns=request.quota_columns,
        quotas=request.quotas,
        seed=request.seed,
        allow_underfilled=request.allow_underfilled
    )

    persistence = persist_transformation_result(
        request.file_id,
        sampled_df,
    )

    records = dataframe_to_records(sampled_df)
    result = QuotaSamplingResponseData(
        file_id=request.file_id,
        source=source,
        **persistence,
        method="quotas",
        total_rows=total_rows,
        sample_size=len(sampled_df),
        seed=request.seed,
        confidence=request.confidence,
        quota_columns=request.quota_columns,
        quota_results=[
            QuotaCellResponse(**quota_result)
            for quota_result in quota_results
        ],
        selected_indices=selected_indices,
        rows=len(sampled_df),
        columns=list(sampled_df.columns),
        preview=records[:5],
        data=records
    )
    return APIResponse.ok(
        data=result,
        message="Quota sample generated successfully"
    )


@router.post(
    "/stratified",
    response_model=APIResponse[StratifiedSamplingResponseData]
)
async def stratified(request: StratifiedSamplingRequest):
    dataset_id = request.dataset_id
    strate_col = request.strate_col
    n = request.n
    mode = request.mode

    df, _source = load_working_dataframe(dataset_id)
    if df is None:
        return APIResponse.fail("Dataset introuvable")

    if mode not in VALID_MODES:
        return APIResponse.fail(f"Mode inconnu. Valeurs acceptées : {', '.join(VALID_MODES)}")

    result = stratified_sample(df, strate_col=strate_col, n=n, mode=mode)

    if "error" in result:
        return APIResponse.fail(result["error"])

    save_dataset(dataset_id, result["df"], stage="preview")

    return APIResponse.ok(StratifiedSamplingResponseData(
        file_id=dataset_id,
        message=f"Échantillonnage stratifié appliqué ({result['mode']})",
        strate_col=result["strate_col"],
        modalites=result["modalites"] if isinstance(result["modalites"], list) else [],
        rows_original=result["rows_original"],
        rows_sampled=result["rows_sampled"],
        marge_erreur=result["marge_erreur"],
        niveau_confiance=float(str(result["niveau_confiance"]).replace("%", "")),
        preview=result["preview"]
    ))


@router.post(
    "/bootstrap",
    response_model=APIResponse[BootstrapSamplingResponseData],
)
async def bootstrap(request: BootstrapSamplingRequest):
    dataset_id = request.dataset_id
    n = request.n

    df, _source = load_working_dataframe(dataset_id)

    if df is None:
        return APIResponse.fail("Dataset introuvable")

    result = bootstrap_sample(df, n=n)

    if "error" in result:
        return APIResponse.fail(result["error"])

    save_dataset(dataset_id, result["df"], stage="preview")

    return APIResponse.ok(
        BootstrapSamplingResponseData(
            file_id=dataset_id,
            message=f"Échantillonnage bootstrap appliqué (n={n})",
            rows_original=result["rows_original"],
            rows_sampled=result["rows_sampled"],
            marge_erreur=result["marge_erreur"],
            niveau_confiance=float(
                str(result["niveau_confiance"]).replace("%", "")
            ),
            preview=result["preview"],
        )
    )