import React, { useEffect, useState } from 'react';
import Qs from 'qs';
import { Grid, CssBaseline, Toolbar } from '@material-ui/core';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

import DownloadSnackbar from './components/DownloadSnackbar/DownloadSnackbar';
import Header from './components/Header/Header';
import YourCode from './components/YourCode/YourCode';
import Results from './components/Results/Results';
import Footer from './components/Footer/Footer';
import SideBar from './components/SideBar/SideBar';
import { tutorials } from './tutorials';
import { queryCache, useQuery } from 'react-query';
import { compiler } from './compiler';
import type { OutputResult } from './compiler';

const DEFAULT_SOURCE = `//write your code here
print("hello world")
`;

const HedgehogLab: React.FC = () => {
  const [source, setSource] = useState<string>(DEFAULT_SOURCE);
  const [input, setInput] = useState<string>('');
  const [localList, setLocalList] = useState<{ description: string; source: string }[]>([]);
  const lgBreakpoint = window.matchMedia('(min-width: 1280px)');
  const lgBreakpointMatches = lgBreakpoint.matches;
  // SideBar open prop
  const [siderBarOpen, setOpen] = useState(lgBreakpointMatches);
  const [result, setResult] = useState<OutputResult>({
    outputItem: [],
    outputString: ''
  });

  const getLocalCodeList = () => {
    const result = localStorage.getItem('localNameList');
    if (result) {
      const list = JSON.parse(result) as string[];
      const newLocalList = [];
      for (let i = 0; i < list.length; i++) {
        if (list[i] !== 'localNameList') {
          newLocalList.push({
            description: list[i],
            source: localStorage.getItem(list[i]) as string
          });
        }
      }
      console.log(newLocalList);
      setLocalList(newLocalList);
    } else {
      localStorage.setItem('localNameList', JSON.stringify(['localNameList']));
    }
  };

  const params = window.location.search;

  let yourUrl = null;

  let autoRun = null;

  if (params) {
    const obj = Qs.parse(params, { ignoreQueryPrefix: true });
    yourUrl = obj.your_url ? (obj.your_url as string) : null;
    autoRun = obj.auto_run === 'true';
  }

  const { isFetching: isLoading, refetch } = useQuery<
    OutputResult,
    readonly [string, string]
    //Error
  >(['compiler', input], compiler, {
    retry: false,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    enabled: false,
    onSuccess: (result: OutputResult) => {
      setResult(result);
    },
    onError: (lastError:any) => {
      // It's necessary to output all exception messages to user at output textbox,
      // including execution runtime exception and compiling exception -Lidang
      console.log('Hedgehog Lab: Failed: ' + lastError.toString());
      setResult({
        outputItem: [],
        outputString: lastError.toString()
      });
    }
  });

  const handleLoadTutorial = (event: React.MouseEvent, index: number) => {
    const str = tutorials[index].source as string;
    if (str === source) return;
    setSource(str);
    setResult({
      outputItem: [],
      outputString: ''
    });
    setInput(str);
  };

  const handleLoadFile = (str: string) => {
    if (str === source) return;
    setSource(str);
    setResult({
      outputItem: [],
      outputString: ''
    });
    setInput(str);
  };

  const handleCompileAndRun = () => {
    setResult({
      outputItem: [],
      outputString: ''
    });
    if (source === input) {
      refetch({ force: true } as any);
    } else {
      setInput(source);
    }
  };

  const useStyles = makeStyles((theme: Theme) =>
    createStyles({
      root: {
        display: 'flex'
      },
      content: {
        flexGrow: 1
      }
    })
  );

  const classes = useStyles();

  useEffect(() => {
    if (!!input) refetch({ force: true } as any);
  }, [input, refetch]);

  useEffect(() => {
    queryCache.cancelQueries(['compiler']);
    getLocalCodeList();
  }, []);

  return (
    <div>
      <div className={classes.root}>
        <CssBaseline />

        <Header
          siderBarOpen={siderBarOpen}
          setOpen={setOpen}
          lgBreakpointMatches={lgBreakpointMatches}
        />

        <SideBar
          handleLoadTutorial={handleLoadTutorial}
          siderBarOpen={siderBarOpen}
          handleLoadFile={handleLoadFile}
          source={source}
          getLocalCodeList={getLocalCodeList}
          localList={localList}
        />

        <main className={classes.content}>
          <Toolbar />

          <Grid container>
            <Grid item xs={12}>
              <Grid
                container
                style={{
                  height: 'calc(100vh - 174px)'
                }}>
                <Grid item xs={12} md={6}>
                  <YourCode
                    handleCompileAndRun={handleCompileAndRun}
                    setSource={setSource}
                    source={source}
                    loading={isLoading}
                  />
                </Grid>

                <Grid
                  item
                  xs={12}
                  md={6}
                  style={{
                    height: 'calc(100vh - 64px)',
                    overflowY: 'auto'
                  }}>
                  <Results
                    executionOutputList={result.outputItem}
                    executionOutputString={result.outputString}
                    loading={isLoading}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>

          <Footer />
        </main>
      </div>

      {yourUrl && (
        <DownloadSnackbar
          setResult={setResult}
          setSource={setSource}
          setInput={setInput}
          yourUrl={yourUrl}
          autoRun={!!autoRun}
        />
      )}
    </div>
  );
};

export default HedgehogLab;
