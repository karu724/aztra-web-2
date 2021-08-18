import axios, { AxiosError } from 'axios';
import api from 'datas/api';
import { GetServerSideProps, NextPage } from 'next';
import Head from 'next/head';
import { Button, Card, Col, Container, Row } from 'react-bootstrap';
import useSWR from 'swr';
import { PartialInviteGuild } from 'types/DiscordTypes';
import urljoin from 'url-join';
import { LockOutlined as LockOutlinedIcon } from '@material-ui/icons';

interface InviteProps {
  inviteId: string;
}

export const getServerSideProps: GetServerSideProps<InviteProps> = async (
  context
) => {
  const { inviteid } = context.query;
  return {
    props: {
      inviteId: inviteid as string,
    },
  };
};

const Invite: NextPage<InviteProps> = ({ inviteId }) => {
  const { data, mutate, error } = useSWR<PartialInviteGuild, AxiosError>(
    urljoin(api, `/invites/${inviteId}`),
    (url) => axios.get(url).then((r) => r.data)
  );

  return (
    <>
      <Head>
        <title>{data?.name} 서버 참가하기</title>
      </Head>
      {data ? (
        <Container
          fluid="sm"
          className="text-white"
          style={{ height: '100vh' }}
        >
          <Row className="justify-content-center align-items-center h-100">
            <Col lg={6}>
              <Card bg="dark" className="shadow">
                <Card.Body className="text-center">
                  <div className="py-5">
                    <img
                      alt={data.name}
                      className="rounded-circle mb-3"
                      src={`https://cdn.discordapp.com/icons/${data.id}/${data.icon}.png`}
                      style={{ width: 100, height: 100 }}
                    />
                    <div className="mb-1">서버에 초대됨:</div>
                    <h2>{data.name}</h2>
                    <div className="d-flex justify-content-center align-items-center">
                      {/*
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            backgroundColor: 'MediumSeaGreen',
                          }}
                          className="rounded-circle mx-2"
                        />
                        {data.presenceCount} 온라인
                      */}
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          backgroundColor: 'gray',
                        }}
                        className="rounded-circle mr-2"
                      />
                      {data.memberCount} 멤버
                    </div>
                  </div>

                  <div>
                    <Button variant="aztra" size="lg" className="w-100 mb-3">
                      <b>{data.name}</b> 서버 참가하기
                    </Button>
                    <a
                      className="text-light cursor-pointer"
                      onClick={() => {
                        window.opener = window.self;
                        window.close();
                      }}
                    >
                      사양할게요
                    </a>
                  </div>
                </Card.Body>
              </Card>
              <div className="mt-2 text-right" style={{ color: 'darkgray' }}>
                <small className="d-inline-flex align-items-center">
                  <LockOutlinedIcon className="mr-1" fontSize="small" />
                  Aztra 보안 초대 시스템
                </small>
              </div>
            </Col>
          </Row>
        </Container>
      ) : null}
    </>
  );
};

export default Invite;
