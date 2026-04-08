export function ThemedImage({
	alt,
	basePath,
}: {
	alt: string;
	basePath: string;
}) {
	return (
		<>
			<img
				src={`${basePath}-light.png`}
				alt={alt}
				className="block rounded-lg border dark:hidden"
			/>
			<img
				src={`${basePath}-dark.png`}
				alt={alt}
				className="hidden rounded-lg border dark:block"
			/>
		</>
	);
}
