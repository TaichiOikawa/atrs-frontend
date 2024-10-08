import { rem } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconX } from "@tabler/icons-react";
import ms from "ms";
import { useEffect, useState } from "react";
import styled from "styled-components";
import {
  getActivity,
  getActivityStatus,
  postActivity,
} from "../../api/activity";
import Organization from "../../components/parts/Organization";
import { ActivityType } from "../../types/activity";
import AttentionModal, { ModalConfigType } from "./components/AttentionModal";
import Cards from "./components/Cards";
import MemberStatusButton from "./components/MembersStatusButton";
import RecordButton from "./components/RecordButton";

const Container = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  gap: 11px;
  margin: 0 0 25px;
  padding: 0 30px;
  position: relative;

  & Button {
    width: 100%;
  }
`;

function DashboardMain() {
  const [isAttend, setIsAttend] = useState<boolean>(false);
  const [activity, setActivity] = useState<ActivityType>({
    attendTime: null,
    leaveTime: null,
    activityTime: null,
    weeklyTime: null,
    totalTime: null,
  });

  const [modalConfig, setModalConfig] = useState<ModalConfigType>({
    onClose: () => {},
    title: "",
    description: "",
  });

  const [opened, toggle] = useDisclosure(false);
  const close = (value: string, resolve: (value: string) => void) => {
    resolve(value);
    toggle.close();
  };

  const xIcon = <IconX size={rem(20)} />;

  console.log("DashboardMainが再描画されました");
  console.log("isAttend:", isAttend);
  console.log("Activity:", activity);

  useEffect(() => {
    (async () => {
      // 活動状態を取得
      const updatedIsAttend = await getActivityStatus();
      setIsAttend(updatedIsAttend);
      // 活動記録を取得
      const activity = await getActivity();
      setActivity(activity);
    })();
  }, []);

  const postActivityButton = async () => {
    const now = new Date();
    if (!activity.leaveTime && activity.attendTime) {
      const attend = new Date(activity.attendTime);
      const diff = now.getTime() - attend.getTime();
      // 活動時間が1分以下の場合
      if (diff < ms("1m")) {
        const ret = await new Promise<string>((resolve) => {
          setModalConfig({
            onClose: (value: string) => close(value, resolve),
            title: "活動時間が1分以下です",
            description: "退席を記録しますか？",
          });
          toggle.open();
        });
        console.log(`[postActivityButton] ret:`, ret);
        if (ret === "cancel" || ret === "close") {
          return;
        }
      }
    }
    if (activity.leaveTime) {
      const leave = new Date(activity.leaveTime);
      if (leave.getDate() == now.getDate()) {
        const ret = await new Promise<string>((resolve) => {
          setModalConfig({
            onClose: (value: string) => close(value, resolve),
            title: "既に出席記録が存在しています",
            description: "再度出席を記録しますか？",
          });
          toggle.open();
        });
        console.log(`[postActivityButton] ret:`, ret);
        if (ret === "cancel" || ret === "close") {
          return;
        }
      }
    }
    try {
      await postActivity();
    } catch (error) {
      console.error(`[postActivityButton] error:`, error);
      notifications.show({
        title: "エラーが発生しました",
        message: "もう一度お試しください",
        icon: xIcon,
        color: "red",
      });
      return;
    }
    const updatedActivity = await getActivity();
    setActivity(updatedActivity);
    const updatedIsAttend = await getActivityStatus();
    setIsAttend(updatedIsAttend);
    if (updatedIsAttend) {
      notifications.show({
        message: "出席を記録しました",
        color: "blue",
      });
    } else {
      notifications.show({
        message: "退席を記録しました",
        color: "orange",
      });
    }
    console.log(`[postActivityButton] updatedActivity:`, updatedActivity);
  };

  return (
    <Container>
      <Organization />
      <RecordButton
        isAttend={isAttend}
        postActivityButton={postActivityButton}
      />
      <Cards activity={activity} />
      <MemberStatusButton update={isAttend} />
      <AttentionModal opened={opened} config={modalConfig} />
    </Container>
  );
}

export default DashboardMain;
