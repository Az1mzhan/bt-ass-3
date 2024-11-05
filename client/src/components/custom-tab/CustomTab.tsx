import { FC, ReactElement } from "react";
import { Box } from "@mui/material";

interface Props {
  isHidden: boolean;
  element: ReactElement;
}

export const CustomTab: FC<Props> = ({ isHidden, element }: Props) => {
  return <Box hidden={isHidden}>{element}</Box>;
};
