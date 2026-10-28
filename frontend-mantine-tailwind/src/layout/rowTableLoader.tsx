import { Skeleton } from "@mantine/core";

interface loaderProps {
  colLength?: number;
  rowLength?: number;
  lineHeight?: number;
}

export default function LineLoader(props: loaderProps) {
  const colLength = props.colLength || 1;
  const rowLength = props.rowLength || 1;
  const lineHeight = props.lineHeight || 8;

  return (
    <>
      {[...Array(rowLength)].map((x, rowIndex) => (
        <tr key={rowIndex}>
          {[...Array(colLength)].map((x, colIndex) => (
            <td key={colIndex}>
              <Skeleton height={lineHeight} radius="xl" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
